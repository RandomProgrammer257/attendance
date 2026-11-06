import React, { useState } from "react";
import { authApi } from "../../api";
import { TeacherDTO } from "../../models";

interface LoginFormProps {
  onLoginSuccess: (teacher: TeacherDTO) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const teacher = await authApi.login(name, password);
      onLoginSuccess(teacher);
      setError(null);
    } catch {
      setError("Неверное имя или пароль или сервер недоступен");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="container">
      <h2>Вход учителя</h2>
      <input type="text" placeholder="Имя" value={name} onChange={e => setName(e.target.value)} />
      <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit">{loading ? "Вход..." : "Войти"}</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
};
