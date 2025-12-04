import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate(); // <- hook to redirect

  const handleSignup = (e) => {
    e.preventDefault();

    // You can add API call here to save user

    alert(`Signup successful!\nEmail: ${email}`);

    // Redirect to login page
    navigate("/login");
  };

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">Signup</h1>
      <form onSubmit={handleSignup} className="flex flex-col gap-3 max-w-sm">
        <input
          type="email"
          placeholder="Email"
          className="border p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="bg-blue-600 text-white px-3 py-2 rounded">
          Signup
        </button>
      </form>
    </div>
  );
}


