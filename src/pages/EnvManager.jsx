import React from "react";
import { motion } from "framer-motion";

export default function EnvManager({ environments, setEnvironments }) {
  const envs = Object.keys(environments);

  function updateValue(env, key, value) {
    setEnvironments((prev) => ({
      ...prev,
      [env]: { ...prev[env], [key]: value },
    }));
  }

  return (
    <div className="p-4 border rounded-lg shadow-md bg-white dark:bg-gray-800">
      <h2 className="font-semibold mb-4 text-gray-900 dark:text-gray-200">
        Environment Variables
      </h2>

      {envs.map((env) => (
        <div key={env} className="mb-6">
          <h3 className="font-bold capitalize mb-2 text-gray-900 dark:text-gray-200">{env}</h3>

          {Object.keys(environments[env]).map((key) => (
            <div className="flex space-x-3 mb-2" key={key}>
              <label className="w-32 text-gray-900 dark:text-gray-200">{key}</label>

              <motion.input
                className="border px-2 py-1 rounded-lg flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200"
                value={environments[env][key]}
                onChange={(e) => updateValue(env, key, e.target.value)}
                whileFocus={{ scale: 1.02, boxShadow: "0 0 5px rgba(59,130,246,0.5)" }}
                whileHover={{ scale: 1.01 }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

