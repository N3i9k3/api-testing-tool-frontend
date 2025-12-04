import ReactJson from "react18-json-view";


export default function ResponseViewer({ response }) {
  if (!response) return <div className="p-4">No response yet</div>;

  return (
    <div className="p-4 space-y-4">

      {/* Status + Time */}
      <div className="flex space-x-3 text-sm">
        <span className="px-3 py-1 bg-green-600 text-white rounded">
          {response.status}
        </span>
        <span className="px-3 py-1 bg-gray-700 text-white rounded">
          {response.time} ms
        </span>
      </div>

      {/* JSON Viewer */}
      <ReactJson
        src={response.body}
        collapsed={1}       // collapses nested objects
        enableClipboard={true}
        displayDataTypes={false}
        theme="monokai"
        style={{ padding: "15px", borderRadius: "8px" }}
      />
    </div>
  );
}
