import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth.js";
import SectionHead from "../components/SectionHead.jsx";

export default function Register() {
  const { user, register } = useAuth();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={location.state?.from || "/music"} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("The two passwords are different.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await register(username, email, password);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="p-auth">
      <SectionHead title="Register" />
      <form onSubmit={handleSubmit} className="c-form">
        <label className="c-field">
          <span className="c-field__label">Username</span>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username"
            pattern="[A-Za-z0-9_]{3,20}" title="3-20 letters, numbers or underscores" required />
        </label>
        <label className="c-field">
          <span className="c-field__label">Email (optional)</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </label>
        <label className="c-field">
          <span className="c-field__label">Password</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password"
            minLength={8} maxLength={72} required />
        </label>
        <label className="c-field">
          <span className="c-field__label">Confirm password</span>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
        </label>
        {error && <p className="c-message c-message--error">{error}</p>}
        <div className="c-form__actions">
          <button type="submit" className="c-pill c-pill--fill" disabled={submitting}>{submitting ? "Registering" : "Register"}</button>
        </div>
      </form>
      <p className="p-auth__switch">Already have an account? <Link to="/login" state={location.state} className="c-underline">Log in</Link></p>
    </div>
  );
}
