import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { csvCell, publicImageUrl, validateImageFile, MAX_IMAGE_BYTES } from "../image-input";
import { readLimitedJson, requireSameOrigin } from "../http";
import { describeImage, normalizeImage } from "../vision";

test("image input rejects SVG, empty and oversized files", () => {
  for (const file of [{type:"image/svg+xml",size:10},{type:"image/png",size:0},{type:"image/jpeg",size:MAX_IMAGE_BYTES+1}]) assert.ok(validateImageFile(file));
  assert.equal(validateImageFile({type:"image/webp",size:100}),null);
});
test("remote links reject local addresses, credentials, non-HTTPS and ports", () => {
  for (const url of ["http://example.com/a","https://127.0.0.1/a","https://2130706433/a","https://[::1]/a","https://localhost/a","https://host.internal/a","https://u:p@example.com/a","https://example.com:444/a"]) assert.throws(() => publicImageUrl(url));
  assert.equal(publicImageUrl("https://images.example.com/a.png").hostname,"images.example.com");
});
test("CSV cells neutralize spreadsheet formulas and retain quotes/newlines", () => {
  for (const value of ["=1+2","+cmd","-cmd","@SUM(A1)"," \t=1","\tdata"]) assert.ok(csvCell(value).startsWith('"\''));
  assert.equal(csvCell('hello "world"\nline'),'"hello ""world""\nline"');
});
test("origin guard rejects absent and cross-site origins", () => {
  const original = process.env.NEXT_PUBLIC_APP_URL, authUrl = process.env.AUTH_URL; delete process.env.AUTH_URL; process.env.NEXT_PUBLIC_APP_URL = "https://site.example";
  try {
    assert.throws(() => requireSameOrigin(new Request("https://site.example/api/describe")));
    assert.throws(() => requireSameOrigin(new Request("https://site.example/api/describe",{headers:{origin:"https://evil.example"}})));
    assert.doesNotThrow(() => requireSameOrigin(new Request("https://site.example/api/describe",{headers:{origin:"https://site.example"}})));
  } finally { if(original === undefined) delete process.env.NEXT_PUBLIC_APP_URL; else process.env.NEXT_PUBLIC_APP_URL = original; if(authUrl === undefined) delete process.env.AUTH_URL; else process.env.AUTH_URL=authUrl; }
});
test("server origin follows runtime AUTH_URL when the public build origin differs",()=>{
  const previous={auth:process.env.AUTH_URL,public:process.env.NEXT_PUBLIC_APP_URL};
  try {
    process.env.AUTH_URL="https://runtime.example";process.env.NEXT_PUBLIC_APP_URL="https://build.example";
    assert.doesNotThrow(()=>requireSameOrigin(new Request("http://internal/api/admin/actions",{headers:{origin:"https://runtime.example"}})));
    assert.throws(()=>requireSameOrigin(new Request("http://internal/api/admin/actions",{headers:{origin:"https://build.example"}})));
    assert.throws(()=>requireSameOrigin(new Request("http://internal/api/admin/actions",{headers:{origin:"https://runtime.example","sec-fetch-site":"cross-site"}})));
  } finally {
    if(previous.auth===undefined)delete process.env.AUTH_URL;else process.env.AUTH_URL=previous.auth;
    if(previous.public===undefined)delete process.env.NEXT_PUBLIC_APP_URL;else process.env.NEXT_PUBLIC_APP_URL=previous.public;
  }
});
test("body limits apply to chunked requests without content-length", async () => {
  const stream = new ReadableStream({start(control){control.enqueue(new TextEncoder().encode('{"image":"'+ "a".repeat(200)+'"}'));control.close();}});
  const req = new Request("https://site.example",{method:"POST",headers:{"content-type":"application/json"},body:stream,duplex:"half"} as RequestInit);
  await assert.rejects(readLimitedJson(req,100),{status:413});
  await assert.rejects(readLimitedJson(new Request("https://site.example",{method:"POST",headers:{"content-type":"application/json"},body:"[]"}),100),{status:400});
});
test("image normalization decodes raster and rejects disguised content", async () => {
  const png = await sharp({create:{width:4,height:4,channels:3,background:"#4169e1"}}).png().toBuffer();
  const image = await normalizeImage("data:image/png;base64,"+png.toString("base64"));
  const meta = await sharp(Buffer.from(image.data,"base64")).metadata();
  assert.equal(meta.width,4);assert.equal(meta.exif,undefined);
  await assert.rejects(normalizeImage("data:image/jpeg;base64,"+png.toString("base64")),{status:400});
  await assert.rejects(normalizeImage("data:image/png;base64,"+Buffer.from("<svg></svg>").toString("base64")),{status:400});
  await assert.rejects(normalizeImage("https://example.com/a.png"),{status:400});
});
test("vision contract sends image bytes and language, validates complete outputs", async () => {
  const previous = {key:process.env.VISION_API_KEY,model:process.env.VISION_MODEL};
  process.env.VISION_API_KEY="test-fixture";process.env.VISION_MODEL="test-model";
  const outputs={detailed:"scene",short:"caption",alt:"alt",social:"social"};
  try {
    const result=await describeImage({mimeType:"image/png",data:"YWJj"},"French",async(url,init)=>{
      assert.equal(url,"https://generativelanguage.googleapis.com/v1beta/models/test-model:generateContent");
      assert.equal(init?.method,"POST");assert.equal(init?.redirect,"error");
      const body=JSON.parse(String(init?.body));
      assert.equal(body.contents[0].parts[0].inlineData.data,"YWJj");
      assert.match(body.contents[0].parts[1].text,/French/);
      assert.equal(body.generationConfig.responseMimeType,"application/json");
      return Response.json({candidates:[{finishReason:"STOP",content:{parts:[{text:JSON.stringify(outputs)}]}}]});
    });
    assert.deepEqual(result,outputs);
    await assert.rejects(describeImage({mimeType:"image/png",data:"YWJj"},"French",async()=>Response.json({candidates:[{finishReason:"MAX_TOKENS",content:{parts:[]}}]})),{status:502});
    delete process.env.VISION_API_KEY;
    let called=false;
    await assert.rejects(describeImage({mimeType:"image/png",data:"x"},"English",async()=>{called=true;return Response.json({});}),{status:503});
    assert.equal(called,false);
  } finally {
    if(previous.key === undefined) delete process.env.VISION_API_KEY; else process.env.VISION_API_KEY=previous.key;
    if(previous.model === undefined) delete process.env.VISION_MODEL; else process.env.VISION_MODEL=previous.model;
  }
});
