import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

// ✅ BACKEND URL (Netlify → Railway)
const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

function Dashboard() {
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [responseData, setResponseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ---------------------------------------------------
  // Load collections from backend
  // ---------------------------------------------------
  const fetchCollections = async () => {
    try {
      setError("");
      const res = await fetch(`${BASE_URL}/collections`);
      if (!res.ok) throw new Error("Failed to fetch collections");

      const data = await res.json();
      setCollections(data.collections || []);
    } catch (err) {
      setError("Failed to load collections");
    }
  };

  // ---------------------------------------------------
  // Run API request through backend proxy
  // ---------------------------------------------------
  const handleSendRequest = async () => {
    if (!selectedCollection) return;

    try {
      setLoading(true);
      setError("");
      setResponseData(null);

      const res = await fetch(`${BASE_URL}/proxy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method: selectedCollection.method,
          url: selectedCollection.url,
          headers: selectedCollection.headers || {},
          body: selectedCollection.body || {},
        }),
      });

      if (!res.ok) throw new Error("Failed to fetch response");

      const data = await res.json();
      setResponseData(data);
    } catch (err) {
      setError("Request failed");
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------
  // Load collections on mount
  // ---------------------------------------------------
  useEffect(() => {
    fetchCollections();
  }, []);

  return (
    <div className="p-6 flex gap-6">
      {/* ------------------ LEFT PANEL ------------------ */}
      <motion.div
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-1/3 p-4 bg-gray-900 rounded-xl shadow-lg"
      >
        <h2 className="text-xl font-semibold mb-4">Collections</h2>

        {collections.length === 0 ? (
          <p className="text-gray-400">No collections found.</p>
        ) : (
          collections.map((col) => (
            <div
              key={col.id}
              onClick={() => setSelectedCollection(col)}
              className={`p-3 mb-2 rounded-lg cursor-pointer border ${
                selectedCollection?.id === col.id
                  ? "bg-blue-600 border-blue-400"
                  : "bg-gray-800 border-gray-700"
              }`}
            >
              <h3 className="font-semibold">{col.name}</h3>
              <p className="text-gray-400 text-sm">{col.method} — {col.url}</p>
            </div>
          ))
        )}
      </motion.div>

      {/* ------------------ RIGHT PANEL ------------------ */}
      <motion.div
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-2/3 p-4 bg-gray-900 rounded-xl shadow-lg"
      >
        <h2 className="text-xl font-semibold mb-4">API Response</h2>

        {selectedCollection ? (
          <>
            <button
              onClick={handleSendRequest}
              className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
            >
              Send Request
            </button>

            {loading && <p className="mt-4 text-yellow-400">Loading...</p>}
            {error && <p className="mt-4 text-red-400">{error}</p>}

            {responseData && (
              <pre className="mt-4 bg-gray-800 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(responseData, null, 2)}
              </pre>
            )}
          </>
        ) : (
          <p className="text-gray-400">Select a collection to view details.</p>
        )}
      </motion.div>
    </div>
  );
}

export default Dashboard;


