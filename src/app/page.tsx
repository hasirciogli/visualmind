'use client';

import React, { useState, useCallback, CSSProperties } from 'react';
import ReactFlow, {
  addEdge,
  Connection,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  DefaultEdgeOptions,
  Handle,
  Position,
  NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Types matching the API response (can inherit from React Flow types or be separate)
// NodeData defines the data structure we expect from the API
interface ApiNodeData {
  label: string;
  description?: string; // description field can be optional or required if it always comes
}

// ApiNode is similar to React Flow Node type but with ApiNodeData for the data field
interface ApiNode extends Omit<Node<ApiNodeData>, 'data'> {
  data: ApiNodeData;
}

// Edge type is the same as what comes from the API, so React Flow's Edge type can be used
// interface ApiEdge extends Edge {}

// General structure of the API response
interface MindMapApiResponse {
  nodes: ApiNode[];
  edges: Edge[]; // Edges are directly compatible
}

// No need for API Key on the client side anymore
// const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

// Example initial nodes and edges (can be empty)
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

// Node style for dark mode (moved to Global CSS)
// const nodeStyle: CSSProperties = {
//   background: '#2a2a2a',
//   color: '#f0f0f0',
//   border: '1px solid #555',
//   borderRadius: '8px',
//   padding: '10px 15px',
//   fontSize: '12px',
//   boxShadow: '0 2px 5px rgba(0, 0, 0, 0.4)',
// };

// Edge options for dark mode
const defaultEdgeOptions: DefaultEdgeOptions = {
  style: { strokeWidth: 2, stroke: '#8b5cf6' },
  animated: true,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#8b5cf6',
  },
};

// No need for GenAI instance on the client side anymore
// let genAI: GoogleGenerativeAI | null = null;
// if (API_KEY) {
//   genAI = new GoogleGenerativeAI(API_KEY);
// } else {
//   console.error("Google API Key not found. Please check your .env.local file and define it as NEXT_PUBLIC_GOOGLE_API_KEY.");
// }

// Özel Düğüm Bileşeni
const CustomNode: React.FC<NodeProps<ApiNodeData>> = ({ data }) => {
  return (
    // Dış container, pozisyonlama için
    <div style={{ position: 'relative' }}>
      {/* Görünür ana düğüm kısmı */}
      <div
        className="custom-node-body" // Stil için sınıf
        style={{
          background: '#2a2a2a',
          color: '#f0f0f0',
          border: '1px solid #555',
          borderRadius: '8px',
          padding: '10px 15px', // Padding burada
          fontSize: '12px',
          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.4)',
          minWidth: '150px',
          position: 'relative', // Handle'lar için gerekli
          zIndex: 1, // Açıklamanın üzerinde kalması için
        }}
      >
        <Handle type="target" position={Position.Top} style={{ background: '#555', zIndex: 2 }} />
        <strong>{data.label}</strong>
        <Handle type="source" position={Position.Bottom} style={{ background: '#555', zIndex: 2 }} />
      </div>

      {/* Yan tarafta görünecek açıklama */}
      {data.description && (
        <div
          className="custom-node-description"
          style={{
            position: 'absolute',
            left: '105%', // Sağa doğru %105 ittir (düğüm genişliğine göre)
            top: '50%', // Dikeyde ortala
            transform: 'translateY(-50%)',
            background: 'rgba(40, 40, 40, 0.9)', // Hafif transparan arka plan
            color: '#ccc',
            padding: '5px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            maxWidth: '200px',
            zIndex: 10, // Düğümün üzerinde görünmesi için zIndex artırıldı
            whiteSpace: 'normal',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            pointerEvents: 'none', // Tıklama olaylarını engelle
          }}
        >
          {data.description}
        </div>
      )}
    </div>
  );
};

// React Flow'a özel düğüm tipini tanıt
const nodeTypes = { custom: CustomNode };

export default function Home() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>(initialEdges);
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false); // State for loading status
  const [error, setError] = useState<string | null>(null); // State for error message

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleGenerateClick = async () => {
    if (!topic || isLoading) return; // Don't process if input is empty or loading

    setIsLoading(true);
    setError(null); // Clear previous errors

    try {
      // Send request to backend API route
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: topic }), // Send topic in the body
      });

      if (!response.ok) {
        // Handle unsuccessful responses
        let errorData;
        try {
          errorData = await response.json();
        } catch { // If response is not JSON
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        console.error("API Error (Response):", errorData);
        throw new Error(errorData.error || `API request failed: ${response.status}`);
      }

      // Process successful response
      const mindMapData: MindMapApiResponse = await response.json();

      console.log("API Response (Client):", mindMapData);

      // Validate format of nodes and edges (optional but recommended)
      if (!mindMapData || !Array.isArray(mindMapData.nodes) || !Array.isArray(mindMapData.edges)) {
        throw new Error("API response doesn't contain the expected nodes/edges structure.");
      }

      // Convert ApiNode[] array from API to Node[] array expected by React Flow
      const reactFlowNodes: Node[] = mindMapData.nodes.map((apiNode) => {
        // Drop the description field and keep only the basic Node structure for React Flow
        const { data, ...rest } = apiNode;
        return {
          ...rest, // id, type, position etc. are preserved
          data: { label: data.label, description: data.description }, // We only take the label
          type: 'custom', // Düğüm tipini 'custom' olarak ayarla
        };
      });

      const reactFlowEdges: Edge[] = mindMapData.edges;

      // Set the converted data to state
      setNodes(reactFlowNodes);
      setEdges(reactFlowEdges);

    } catch (err) {
      console.error("Mind Map Generation Error (Client):", err);
      setError(`An error occurred while creating the mind map: ${err instanceof Error ? err.message : String(err)}`);
      // Clear nodes/edges or restore previous state in case of error
      // setNodes(initialNodes);
      // setEdges(initialEdges);
    } finally {
      setIsLoading(false); // Turn off loading state
    }
  };

  return (
    <div style={{ height: '100vh', width: '100vw', backgroundColor: '#121212' }}>
      <div style={{
        padding: '16px',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 10,
        background: '#1e1e1e',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        borderBottom: '1px solid #333'
      }}>
        <div style={{
          position: 'relative',
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center'
        }}>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="What would you like to learn?"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #444',
              borderRadius: '8px',
              backgroundColor: '#2a2a2a',
              color: '#fff',
              fontSize: '16px',
              outline: 'none',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            }}
          />
          {isLoading && (
            <div style={{
              position: 'absolute',
              right: '12px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: '2px solid rgba(99, 102, 241, 0.3)',
              borderTopColor: '#6366f1',
              animation: 'spin 1s linear infinite'
            }}></div>
          )}
        </div>
        <button
          onClick={handleGenerateClick}
          disabled={isLoading || !topic}
          style={{
            padding: '12px 24px',
            border: 'none',
            background: (isLoading || !topic) ? '#333' : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            color: 'white',
            borderRadius: '8px',
            cursor: (isLoading || !topic) ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            fontSize: '16px',
            transition: 'all 0.3s ease',
            boxShadow: (isLoading || !topic) ? 'none' : '0 4px 6px rgba(99, 102, 241, 0.25)',
            minWidth: '120px',
            textAlign: 'center'
          }}
        >
          {isLoading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {/* Show error message */}
      {error && (
        <div style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          background: 'rgba(220, 38, 38, 0.9)',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          maxWidth: '80%',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: 'medium'
        }}>
          {error}
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        nodeTypes={nodeTypes}
        attributionPosition="top-right"
        style={{ marginTop: '70px', background: '#121212' }}
        defaultEdgeOptions={defaultEdgeOptions}
      >
        <Background color="#444" gap={16} />
        <Controls style={{ background: '#1e1e1e', border: '1px solid #333' }} />
        <MiniMap
          style={{ background: '#1e1e1e', border: '1px solid #333' }}
          nodeColor={(node: Node) => {
            return '#8b5cf6';
          }}
          nodeStrokeWidth={3}
          pannable={true}
          zoomable={true}
        />
      </ReactFlow>

      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Default Node Styles (CustomNode için de geçerli olacak) */
        .react-flow__node-custom { /* Custom node'u da hedefle */
          border-radius: 8px !important;
          padding: 0 !important; /* Padding'i CustomNode içinden yöneteceğiz */
          overflow: visible !important; /* Açıklamanın görünmesi için */
        }

        /* Input focus style */
        input[type="text"]:focus {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2) !important;
        }

        /* React Flow Controls button colors */
        .react-flow__controls-button {
          background-color: #2a2a2a !important;
          color: #f0f0f0 !important;
          fill: #f0f0f0 !important;
          border: none !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        .react-flow__controls-button:hover {
          background-color: #3a3a3a !important;
        }

        /* React Flow MiniMap */
        .react-flow__minimap {
          border-radius: 4px;
          overflow: hidden; /* For proper appearance with border */
        }

        /* React Flow Attribution */
        .react-flow__attribution {
          background: rgba(30, 30, 30, 0.7) !important;
          padding: 2px 5px !important;
          border-radius: 3px;
        }
        .react-flow__attribution a {
          color: #aaa !important;
          text-decoration: none;
        }
        .react-flow__attribution a:hover {
          color: #fff !important;
        }
      `}</style>
    </div>
  );
}
