import React, { useState } from 'react';
import styles from './ResultPanel.module.css';

type Node = any;

const nodeTypeColors: Record<string, string> = {
  Program: '#8b5cf6',
  FunctionDeclaration: '#3b82f6',
  VariableDeclaration: '#10b981',
  ExpressionStatement: '#f59e0b',
  CallExpression: '#ef4444',
  BinaryExpression: '#ec4899',
  Identifier: '#6366f1',
  NumericLiteral: '#14b8a6',
  StringLiteral: '#22c55e',
  BlockStatement: '#8b5cf6',
  ReturnStatement: '#f97316',
};

function getNodeColor(type: string): string {
  return nodeTypeColors[type] || '#64748b';
}

function AstNode({ node, depth = 0 }: { node: Node; depth?: number }) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = Array.isArray(node?.children) && node.children.length > 0;
  const nodeType = node?.type || node?.name || 'Node';
  const color = getNodeColor(nodeType);

  return (
    <div
      style={{
        paddingLeft: depth > 0 ? 20 : 0,
        marginTop: depth > 0 ? 6 : 0,
        borderLeft: depth > 0 ? '2px solid rgba(100, 116, 139, 0.2)' : 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          padding: '6px 8px',
          borderRadius: 6,
          transition: 'background 0.15s ease',
          cursor: hasChildren ? 'pointer' : 'default',
          background: 'transparent',
        }}
        onClick={() => hasChildren && setOpen(!open)}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(100, 116, 139, 0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        {hasChildren ? (
          <span
            style={{
              fontSize: 12,
              color: '#94a3b8',
              width: 16,
              textAlign: 'center',
              userSelect: 'none',
            }}
          >
            {open ? '▼' : '▶'}
          </span>
        ) : (
          <span style={{ width: 16 }} />
        )}
        
        <span
          style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 600,
            color: '#fff',
            background: color,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
          }}
        >
          {nodeType}
        </span>

        {node?.name && node.name !== nodeType && (
          <span
            style={{
              fontSize: 13,
              color: '#475569',
              fontWeight: 500,
            }}
          >
            {node.name}
          </span>
        )}

        {node?.value !== undefined && (
          <span
            style={{
              fontSize: 12,
              color: '#059669',
              fontFamily: 'monospace',
              background: '#f0fdf4',
              padding: '2px 6px',
              borderRadius: 3,
            }}
          >
            = {JSON.stringify(node.value)}
          </span>
        )}

        {node?.operator && (
          <span
            style={{
              fontSize: 12,
              color: '#dc2626',
              fontWeight: 600,
            }}
          >
            {node.operator}
          </span>
        )}

        {node?.loc && (
          <span
            style={{
              fontSize: 11,
              color: '#94a3b8',
              marginLeft: 'auto',
              fontFamily: 'monospace',
            }}
          >
            {node.loc.start?.line}:{node.loc.start?.column}
          </span>
        )}
      </div>

      {open && hasChildren && (
        <div style={{ marginTop: 4 }}>
          {node.children.map((c: any, i: number) => (
            <AstNode key={i} node={c} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AstView({ ast }: { ast: any }) {
  if (!ast)
    return (
      <div
        style={{
          padding: 20,
          textAlign: 'center',
          color: '#94a3b8',
          fontSize: 14,
        }}
      >
        Nenhuma AST disponível
      </div>
    );

  return (
    <div
      style={{
        marginTop: 16,
        border: '1px solid rgba(100, 116, 139, 0.2)',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#fafafa',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderBottom: '1px solid rgba(100, 116, 139, 0.2)',
        }}
      >
        <h4
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>🌳</span>
          Árvore Sintática (AST)
        </h4>
      </div>
      <div
        style={{
          padding: 16,
          fontFamily: 'monospace',
          fontSize: 13,
          maxHeight: 480,
          overflowY: 'auto',
          background: '#fff',
        }}
      >
        <AstNode node={ast} depth={0} />
      </div>
    </div>
  );
}
