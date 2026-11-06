"use client";
import { cell, columns, text, type Row } from "./model";

export function AdminTable({ resource,rows,onDetail }: {resource:string;rows:Row[];onDetail:(id:string)=>void}) {
  const fields=columns[resource]??[];
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr>{fields.map(column=><th scope="col" key={column.key} className={column.numeric?"admin-numeric":undefined}>{column.label}</th>)}<th scope="col"><span className="sr-only">操作</span></th></tr></thead><tbody>{rows.map(row=><tr key={text(row.id)}>{fields.map((column,index)=><td key={column.key} data-label={column.label} className={column.numeric?"admin-numeric":undefined}>
    {index===0?<button className="admin-row-identity" title={cell(column.key,row[column.key],row)} onClick={()=>onDetail(text(row.id))}>{cell(column.key,row[column.key],row)}{column.key==="email"&&row.email!=null&&<small>{text(row.user_id)}</small>}</button>:column.key==="status"?<span className="admin-status" data-status={text(row.status)}>{cell(column.key,row[column.key],row)}</span>:<span title={cell(column.key,row[column.key],row)}>{cell(column.key,row[column.key],row)}</span>}
  </td>)}<td className="admin-table-action"><button onClick={()=>onDetail(text(row.id))} aria-label={`查看 ${text(row.email??row.id)} 详情`}>详情 →</button></td></tr>)}</tbody></table></div>;
}
