"use client";
import { ArrowUpRight } from "lucide-react";
import { cell, columns, text, type Row } from "./model";

export function AdminTable({ resource, rows, onDetail }: { resource: string; rows: Row[]; onDetail: (id: string) => void }) {
  const fields = columns[resource] ?? [];
  const secondary = fields.filter((column, index) => index > 0 && ["created_at", "email", "reference_id", "error_code", "payments", "language"].includes(column.key));
  const compact = secondary.slice(0, Math.max(0, fields.length - 5));
  const isCompact = (key: string) => compact.some(column => column.key === key);
  return <div className="admin-table-wrap"><table className="admin-table" data-resource={resource}><thead><tr>{fields.map(column => <th scope="col" key={column.key} className={`${column.numeric ? "admin-numeric" : ""} ${isCompact(column.key) ? "admin-secondary-column" : ""}`}>{column.label}</th>)}<th scope="col"><span className="sr-only">操作</span></th></tr></thead><tbody>{rows.map(row => <tr key={text(row.id)}>{fields.map((column, index) => <td key={column.key} data-label={column.label} className={`${column.numeric ? "admin-numeric" : ""} ${isCompact(column.key) ? "admin-secondary-column" : ""} ${column.key === "status" ? "admin-status-cell" : ""}`}>
    {index === 0 ? <><div className="admin-identity-cell">{resource === "users" && <span className="admin-avatar" aria-hidden="true">{text(row.email).charAt(0).toUpperCase()}</span>}<button className="admin-row-identity" data-identifier={["id","event_id","actor_id"].includes(column.key)} title={cell(column.key, row[column.key], row)} onClick={() => onDetail(text(row.id))}>{cell(column.key, row[column.key], row)}{column.key === "email" && row.email != null && <small>{text(row.user_id)}</small>}</button></div>{compact.length > 0 && <div className="admin-row-secondary">{compact.map(field => <span key={field.key} title={cell(field.key, row[field.key], row)}>{field.label}：{cell(field.key, row[field.key], row)}</span>)}</div>}</> : column.key === "status" ? <span className="admin-status" data-status={text(row.status)}>{cell(column.key, row[column.key], row)}</span> : <span title={cell(column.key, row[column.key], row)}>{cell(column.key, row[column.key], row)}</span>}
  </td>)}<td className="admin-table-action"><button onClick={() => onDetail(text(row.id))} aria-label={`查看 ${text(row.email ?? row.id)} 详情`}><span>详情</span><ArrowUpRight size={14} aria-hidden="true" /></button></td></tr>)}</tbody></table></div>;
}
