import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AceEditor from "react-ace";

// Ace Editor imports
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github"; // light theme
import "ace-builds/src-noconflict/theme-monokai"; // dark theme


import EnvManager from "./EnvManager";

const API_BASE = import.meta.env.api-testing-tool-backend-production.up.railway.app || "http://localhost:5000";

export default function Dashboard() {
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) window.location.href = "/login";
  }, [token]);

  // ---------------- STATES ----------------
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState("GET");
  const [headers, setHeaders] = useState([{ key: "", value: "" }]);
  const [params, setParams] = useState([{ key: "", value: "" }]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);

  const [activeEnv, setActiveEnv] = useState("dev");
  const [environments, setEnvironments] = useState({
    dev: { API_BASE: "", AUTH_TOKEN: "" },
    staging: { API_BASE: "", AUTH_TOKEN: "" },
    prod: { API_BASE: "", AUTH_TOKEN: "" },
  });

  const [collections, setCollections] = useState([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);
  const [collectionItems, setCollectionItems] = useState([]);
  const [newCollectionName, setNewCollectionName] = useState("");

  const [history, setHistory] = useState([]);

  // ---------------- THEME ----------------
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    localStorage.setItem("theme", newTheme);
  };

  // ---------------- HELPERS ----------------
  const addRow = (setter, data) => setter([...data, { key: "", value: "" }]);
  const updateRow = (index, field, value, setter, data) => {
    const updated = [...data];
    updated[index][field] = value;
    setter(updated);
  };
  const convertPairsToObject = (pairs) => {
    const obj = {};
    pairs.forEach((p) => {
      if (p.key) obj[p.key] = p.value;
    });
    return obj;
  };
  const applyEnvVariables = (input) => {
    if (!input) return input;
    let updated = input;
    const envVars = environments[activeEnv] || {};
    Object.keys(envVars).forEach((key) => {
      const pattern = new RegExp(`{{${key}}}`, "g");
      updated = updated.replace(pattern, envVars[key] ?? "");
    });
    return updated;
  };
  const appendQueryParams = (finalUrl) => {
    const query = params.filter((p) => p.key && p.value);
    if (query.length === 0) return finalUrl;
    const qs = query
      .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
      .join("&");
    return finalUrl.includes("?") ? `${finalUrl}&${qs}` : `${finalUrl}?${qs}`;
  };

  // ---------------- COLLECTIONS ----------------
  useEffect(() => {
    fetchCollections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCollections = async () => {
    try {
      const res = await fetch(`${API_BASE}/collections`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setCollections(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("Collections fetch error:", err);
      setCollections([]);
    }
  };

  const loadCollection = async (collectionId) => {
    setSelectedCollectionId(collectionId);
    try {
      const res = await fetch(`${API_BASE}/collections/${collectionId}/items`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const items = await res.json();
      setCollectionItems(Array.isArray(items) ? items : []);
    } catch (err) {
      console.log("Load collection error:", err);
      setCollectionItems([]);
    }
  };

  const createCollection = async () => {
    if (!newCollectionName.trim()) return alert("Enter collection name");
    try {
      await fetch(`${API_BASE}/collections/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newCollectionName }),
      });
      setNewCollectionName("");
      fetchCollections();
    } catch (err) {
      console.log("Create collection error:", err);
    }
  };

  const saveToCollection = async () => {
    if (!selectedCollectionId) return alert("Select a collection first!");
    let parsedBody = {};
    try {
      parsedBody = body ? JSON.parse(body) : {};
    } catch {
      return alert("Invalid JSON Body");
    }

    try {
      await fetch(`${API_BASE}/collections/add-item`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          collection_id: selectedCollectionId,
          url,
          method,
          headers: convertPairsToObject(headers),
          body: parsedBody,
        }),
      });
      alert("Saved to collection!");
      loadCollection(selectedCollectionId);
    } catch (err) {
      console.log("Save to collection error:", err);
    }
  };

  const loadItemToForm = (item) => {
  setUrl(item.url || "");
  setMethod(item.method || "GET");
  setHeaders(
    item.headers && Object.keys(item.headers).length > 0
      ? Object.entries(item.headers).map(([key, value]) => ({ key, value }))
      : [{ key: "", value: "" }]
  );
  setBody(item.body ? JSON.stringify(item.body, null, 2) : "");
};


  const sendRequest = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      let finalUrl = applyEnvVariables(url);
      finalUrl = appendQueryParams(finalUrl);
      let finalBody = applyEnvVariables(body);
      const formattedHeaders = convertPairsToObject(headers);

      if (finalBody && method !== "GET" && method !== "HEAD") {
        try {
          finalBody = JSON.parse(finalBody);
        } catch {
          throw new Error("Invalid JSON Body");
        }
      }

      const fetchOptions = {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      };

      if (method !== "GET" && method !== "HEAD") {
        fetchOptions.body = JSON.stringify({
          url: finalUrl,
          method,
          headers: formattedHeaders,
          body: finalBody || {},
        });
      }

      const res = await fetch(`${API_BASE}/proxy`, fetchOptions);
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const data = await res.json();
      setResponse({
        status: data.status,
        time: data.time,
        headers: data.headers,
        body: data.body,
      });

      setHistory((prev) => [
        { url: finalUrl, method, time: new Date().toLocaleTimeString() },
        ...prev,
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- RENDER ----------------
  return (
    <div className="min-h-screen flex space-x-4 p-4">
      {/* LEFT SIDEBAR */}
      <motion.div
        className="w-1/5 bg-white dark:bg-slate-800 border-r dark:border-slate-700 p-4 flex flex-col rounded-xl shadow-md"
        initial={{ x: -50 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* History */}
        <div className="mb-4 p-2 bg-gray-50 dark:bg-slate-900 rounded-lg">
          <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">History</h3>
          {history.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No requests yet</p>
          ) : (
            history.map((h, idx) => (
              <div
                key={idx}
                className="mb-1 p-1 border rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm"
              >
                {h.method}: {h.url}{" "}
                <span className="text-xs text-gray-500 dark:text-gray-400">({h.time})</span>
              </div>
            ))
          )}
        </div>

        {/* Collections */}
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Collections</h2>
        <div className="flex space-x-2 mb-2">
          <input
            type="text"
            className="border border-gray-300 dark:border-slate-700 rounded-lg p-1 flex-1 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
            placeholder="New Collection"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            className="bg-purple-600 dark:bg-purple-500 hover:bg-purple-700 dark:hover:bg-purple-600 text-white px-2 rounded-lg transition"
            onClick={createCollection}
          >
            Create
          </motion.button>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900 rounded-lg p-2">
          {collections.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">No collections yet</p>
          ) : (
            collections.map((c) => (
              <div key={c.id} className="mb-2">
                <div
                  className={`p-2 border rounded-lg cursor-pointer ${
                    selectedCollectionId === c.id
                      ? "bg-purple-200 dark:bg-purple-700"
                      : "hover:bg-gray-200 dark:hover:bg-slate-700 border-gray-300 dark:border-slate-700"
                  } text-gray-900 dark:text-gray-100`}
                  onClick={() => loadCollection(c.id)}
                >
                  {c.name}
                </div>

                {selectedCollectionId === c.id &&
                  collectionItems.map((item) => (
                    <div
                      key={item.id}
                      className="ml-4 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-300 dark:border-slate-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"
                      onClick={() => loadItemToForm(item)}
                    >
                      <p className="text-sm font-semibold">{item.url}</p>
                      <p className="text-xs">Method: {item.method}</p>
                    </div>
                  ))}
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* CENTER FORM */}
      <div className="w-3/5 p-6 overflow-y-auto">
        {/* TOP BUTTONS */}
        <div className="w-full flex justify-end mb-4 space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={toggleTheme}
            className="bg-gray-400 dark:bg-slate-600 text-white px-4 py-2 rounded-lg transition"
          >
            {theme === "light" ? "🌙 Dark" : "☀️ Light"}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => {
              if (window.confirm("Are you sure you want to logout?")) {
                localStorage.removeItem("token");
                window.location.href = "/login";
              }
            }}
            className="bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
          >
            Logout
          </motion.button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Request Builder</h1>
          <div className="px-3 py-1 bg-blue-600 dark:bg-blue-500 text-white rounded-lg">
            Active: {activeEnv.toUpperCase()}
          </div>
        </div>

        <div className="mb-6">
          <EnvManager environments={environments} setEnvironments={setEnvironments} />
        </div>

        <div className="flex justify-end mb-4">
          <select
            className="border border-gray-300 dark:border-slate-700 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
            value={activeEnv}
            onChange={(e) => setActiveEnv(e.target.value)}
          >
            <option value="dev">Development</option>
            <option value="staging">Staging</option>
            <option value="prod">Production</option>
          </select>
        </div>

        {/* Request URL */}
        <label className="block font-medium mb-1 text-gray-900 dark:text-gray-100">Request URL</label>
        <input
          type="text"
          className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-2 mb-4 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
          placeholder="https://api.example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        {/* Method & Buttons */}
        <div className="flex items-center space-x-4 mb-6">
          <select
            className="border border-gray-300 dark:border-slate-700 rounded-lg p-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>DELETE</option>
            <option>PATCH</option>
          </select>

          <motion.button
            whileHover={{ scale: 1.05 }}
            className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
            onClick={sendRequest}
          >
            {loading ? (
              <span className="inline-flex items-center space-x-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                <span>Sending...</span>
              </span>
            ) : (
              "Send"
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            className="bg-purple-600 dark:bg-purple-500 hover:bg-purple-700 dark:hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition"
            onClick={saveToCollection}
          >
            Save to Collection
          </motion.button>
        </div>

        {/* HEADERS */}
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Headers</h3>
        {headers.map((h, i) => (
          <div key={i} className="flex space-x-2 mb-2">
            <input
              className="border border-gray-300 dark:border-slate-700 p-2 w-1/2 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
              placeholder="Key"
              value={h.key}
              onChange={(e) => updateRow(i, "key", e.target.value, setHeaders, headers)}
            />
            <input
              className="border border-gray-300 dark:border-slate-700 p-2 w-1/2 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
              placeholder="Value"
              value={h.value}
              onChange={(e) => updateRow(i, "value", e.target.value, setHeaders, headers)}
            />
          </div>
        ))}
        <button className="text-blue-600 dark:text-blue-400 text-sm mb-6" onClick={() => addRow(setHeaders, headers)}>
          + Add Header
        </button>

        {/* PARAMS */}
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Query Params</h3>
        {params.map((p, i) => (
          <div key={i} className="flex space-x-2 mb-2">
            <input
              className="border border-gray-300 dark:border-slate-700 p-2 w-1/2 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
              placeholder="Key"
              value={p.key}
              onChange={(e) => updateRow(i, "key", e.target.value, setParams, params)}
            />
            <input
              className="border border-gray-300 dark:border-slate-700 p-2 w-1/2 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
              placeholder="Value"
              value={p.value}
              onChange={(e) => updateRow(i, "value", e.target.value, setParams, params)}
            />
          </div>
        ))}
        <button className="text-blue-600 dark:text-blue-400 text-sm mb-6" onClick={() => addRow(setParams, params)}>
          + Add Param
        </button>

        {/* BODY */}
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Request Body</h3>
        <AceEditor
          mode="json"
          theme={theme === "light" ? "github" : "monokai"}
          name="requestBodyEditor"
          onChange={(val) => setBody(val)}
          value={body}
          width="100%"
          height="200px"
          fontSize={14}
          setOptions={{ useWorker: false, tabSize: 2 }}
          className="mb-6"
        />

        {/* RESPONSE */}
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Response</h3>
        {loading && (
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 mb-2">
            <span className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin inline-block" />
            <span>Waiting for response…</span>
          </div>
        )}
        {error && <div className="text-red-600 dark:text-red-400 mb-2">{error}</div>}
        {response ? (
          <div className="bg-gray-50 dark:bg-slate-900 p-3 rounded-lg border border-gray-200 dark:border-slate-700 mb-3">
            <p className="text-sm text-gray-900 dark:text-gray-100 mb-1">
              <strong>Status:</strong> {response.status}
            </p>
            <p className="text-sm text-gray-900 dark:text-gray-100 mb-2">
              <strong>Time:</strong> {response.time} ms
            </p>

            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Headers</h4>
            <pre className="text-xs bg-white dark:bg-slate-800 p-2 rounded-md border border-gray-200 dark:border-slate-700 overflow-auto mb-2">
              {JSON.stringify(response.headers)}
            </pre>

            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Body</h4>
            <pre className="text-xs bg-white dark:bg-slate-800 p-2 rounded-md border border-gray-200 dark:border-slate-700 overflow-auto">
              {typeof response.body === "string" ? response.body : JSON.stringify(response.body)}
            </pre>
          </div>
        ) : (
          !loading && <p className="text-gray-500 dark:text-gray-400">Send a request to see response</p>
        )}
      </div>

      {/* RIGHT SIDEBAR */}
      <motion.div
        className="w-1/5 bg-white dark:bg-slate-800 border-l dark:border-slate-700 p-4 rounded-xl shadow-md"
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Info Panel</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">You can add additional info here</p>
      </motion.div>
    </div>
  );
}


