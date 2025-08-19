import { useState, useEffect, useMemo } from "react";
import students from "../data/students.json";
import emailjs from "@emailjs/browser";

const GROUP_NAME = "4-2";

// IDs EmailJS (si quieres ocultarlos, muévelos a .env con prefijo VITE_)
const EMAILJS_SERVICE_ID = "service_2kchrz6";
const EMAILJS_TEMPLATE_ID = "template_z5m0rsd";
const EMAILJS_PUBLIC_KEY  = "Jq93V4hq-fbPChlCw";

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-CO", { timeZone: "America/Bogota" });
}

export default function MyApp() {
  const [dateStr, setDateStr] = useState(() => {
    const t = new Date();
    return t.toISOString().split("T")[0]; // yyyy-mm-dd
  });

  // attendance[id] = true (asistió) | false (faltó)
  const [attendance, setAttendance] = useState(() => {
    const init = {};
    for (const s of students) init[s.id] = true;
    return init;
  });

  // Modales
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Cargar asistencia guardada por fecha
  useEffect(() => {
    const key = `attendance:${GROUP_NAME}:${dateStr}`;
    const saved = localStorage.getItem(key);
    if (saved) setAttendance(JSON.parse(saved));
  }, [dateStr]);

  // Guardar cambios
  useEffect(() => {
    const key = `attendance:${GROUP_NAME}:${dateStr}`;
    localStorage.setItem(key, JSON.stringify(attendance));
  }, [attendance, dateStr]);

  const absentees = useMemo(
    () => students.filter((s) => attendance[s.id] === false),
    [attendance]
  );

  function toggle(id) {
    setAttendance((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function markAll(value) {
    const next = {};
    for (const s of students) next[s.id] = value;
    setAttendance(next);
  }

  // Envío con EmailJS a plantilla con destinatario fijo (configurado en EmailJS)
  async function sendEmail() {
    const fecha = formatDate(dateStr);
    const subject = `Reporte de Inasistencia grupo ${GROUP_NAME}`;

    const bodyHeader = `Reporte de inasistencia\nGrupo: ${GROUP_NAME}\nFecha: ${fecha}\n\n`;
    const bodyList = absentees.map((s, i) => `${i + 1}. ${s.name}`).join("\n");

    // Si no hay ausentes, mensaje por defecto:
    const body =
      absentees.length === 0
        ? `${bodyHeader}Asistieron todos los estudiantes.`
        : bodyHeader + bodyList;

    const templateParams = {
      subject, // {{subject}} en tu plantilla
      body     // {{body}} en tu plantilla
      // Si tu plantilla usa {{name}} o {{email}}, puedes añadirlos aquí:
      // name: "Asistencia 4-2",
      // email: "profesor@colegio.edu.co"
    };

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );
      setShowSuccess(true);
    } catch (err) {
      console.error(err);
      setErrorMsg("No se pudo enviar el correo. Revisa Service/Template/Public Key y la plantilla.");
      setShowError(true);
    }
  }

  return (
    <div className="container">
      <header className="card">
        <h1>Asistencia {GROUP_NAME}</h1>
        <div className="row">
          <label>
            Fecha
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
            />
          </label>
          {/* Sin input de correo: destinatario fijo en EmailJS */}
        </div>
        <div className="row">
          <button className="btn" onClick={() => markAll(true)}>
            Marcar todos: Asistieron
          </button>
          <button className="btn outline" onClick={() => markAll(false)}>
            Marcar todos: Faltaron
          </button>
          <button className="btn primary" onClick={sendEmail}>
            Enviar reporte
          </button>
        </div>
      </header>

      <section className="card">
        <h2>Lista de estudiantes</h2>
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Asistencia</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, idx) => (
              <tr key={s.id}>
                <td>{idx + 1}</td>
                <td>{s.name}</td>
                <td>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={attendance[s.id] ?? false}
                      onChange={() => toggle(s.id)}
                    />
                    <span className="slider"></span>
                  </label>
                  <span className={`badge ${attendance[s.id] ? "yes" : "no"}`}>
                    {attendance[s.id] ? "Asistió" : "Faltó"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Modal de éxito */}
      {showSuccess && (
        <div className="modal">
          <div className="modal-content success">
            <h3>✅ Mensaje enviado</h3>
            <p>El reporte se envió correctamente.</p>
            <button className="modal-btn" onClick={() => setShowSuccess(false)}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal de error */}
      {showError && (
        <div className="modal">
          <div className="modal-content error">
            <h3>❌ Error al enviar</h3>
            <p>{errorMsg}</p>
            <button className="modal-btn" onClick={() => setShowError(false)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
