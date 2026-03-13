"use client";

import { useMemo, useState } from "react";

export default function SupportPage() {
  const [category, setCategory] = useState("Sugestão");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const canSend = useMemo(() => {
    return message.trim().length >= 10;
  }, [message]);

  function handleSend() {
    if (!canSend) return;

    const to = "contato@escalamed.app.br";
    const subject = `EscalaMed - ${category}`;
    const body = `
Nome: ${name || "Não informado"}
E-mail para retorno: ${email || "Não informado"}

Categoria: ${category}

Mensagem:
${message}
    `.trim();

    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <main className="support-page">
      <div className="topbar">
        <div className="brand">escalamed.app.br</div>
      </div>

      <section className="card">
        <div className="header-row">
          <div>
            <h1>Suporte / Feedback</h1>
            <p>
              Encontrou algo para melhorar? Escreva abaixo. Seu feedback ajuda a
              deixar o EscalaMed mais simples e essencial.
            </p>
          </div>

          <a href="/" className="back-btn">
            Voltar
          </a>
        </div>

        <div className="divider" />

        <div className="info-box">
          <div className="info-icon">✉️</div>
          <div>
            <strong>Contato direto</strong>
            <span>contato@escalamed.app.br</span>
          </div>
        </div>

        <div className="form-grid">
          <div className="field">
            <label>Nome</label>
            <input
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="field">
            <label>E-mail para retorno</label>
            <input
              type="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option>Sugestão</option>
              <option>Erro no sistema</option>
              <option>Dúvida</option>
              <option>Solicitação de melhoria</option>
              <option>Outro</option>
            </select>
          </div>

          <div className="field field-full">
            <label>Mensagem</label>
            <textarea
              placeholder="Escreva aqui seu feedback, sugestão ou problema encontrado..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1500}
            />
            <div className="helper-row">
              <span>Quanto mais detalhe, melhor.</span>
              <span>{message.length}/1500</span>
            </div>
          </div>
        </div>

        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!canSend}
        >
          Enviar feedback
        </button>
      </section>

      <style jsx>{`
        .support-page {
          min-height: 100vh;
          background: #f5f3ee;
          padding: 24px 16px 40px;
          color: #111827;
        }

        .topbar {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }

        .brand {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #0b1020;
        }

        .card {
          max-width: 820px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 28px;
          padding: 24px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
          border: 1px solid rgba(17, 24, 39, 0.06);
        }

        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 18px;
        }

        h1 {
          margin: 0;
          font-size: 42px;
          line-height: 1;
          letter-spacing: -0.04em;
          font-weight: 900;
          color: #0b1020;
        }

        p {
          margin: 14px 0 0;
          max-width: 560px;
          font-size: 17px;
          line-height: 1.6;
          color: #7c8798;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 128px;
          height: 68px;
          padding: 0 22px;
          border-radius: 18px;
          background: #1a6b4a;
          color: #fff;
          text-decoration: none;
          font-weight: 800;
          font-size: 18px;
          box-shadow: 0 8px 20px rgba(26, 107, 74, 0.18);
        }

        .divider {
          height: 1px;
          background: #ececec;
          margin: 18px 0 22px;
        }

        .info-box {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 18px;
          border-radius: 20px;
          background: #f7f8f6;
          border: 1px solid #ebeeeb;
          margin-bottom: 22px;
        }

        .info-icon {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e7f0ea;
          font-size: 24px;
        }

        .info-box strong {
          display: block;
          font-size: 15px;
          color: #5f6b7c;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .info-box span {
          font-size: 18px;
          font-weight: 700;
          color: #1a6b4a;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .field {
          display: flex;
          flex-direction: column;
        }

        .field-full {
          grid-column: 1 / -1;
        }

        label {
          margin-bottom: 10px;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #6f7b8f;
        }

        input,
        select,
        textarea {
          width: 100%;
          border: 2px solid #e6e6e6;
          background: #fff;
          border-radius: 18px;
          padding: 18px 20px;
          font-size: 18px;
          color: #111827;
          outline: none;
          transition: 0.2s ease;
          box-sizing: border-box;
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: #1a6b4a;
          box-shadow: 0 0 0 4px rgba(26, 107, 74, 0.08);
        }

        textarea {
          min-height: 220px;
          resize: vertical;
          line-height: 1.6;
        }

        .helper-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
          font-size: 13px;
          color: #8a93a3;
        }

        .send-btn {
          margin-top: 26px;
          width: 100%;
          height: 72px;
          border: 0;
          border-radius: 20px;
          background: #1a6b4a;
          color: #fff;
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 10px 24px rgba(26, 107, 74, 0.2);
          transition: 0.2s ease;
        }

        .send-btn:hover {
          transform: translateY(-1px);
        }

        .send-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        @media (max-width: 768px) {
          .support-page {
            padding: 18px 12px 32px;
          }

          .card {
            padding: 18px;
            border-radius: 24px;
          }

          .header-row {
            flex-direction: column;
          }

          h1 {
            font-size: 30px;
          }

          p {
            font-size: 15px;
          }

          .back-btn {
            width: 100%;
            height: 58px;
            border-radius: 16px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          input,
          select,
          textarea {
            font-size: 16px;
            padding: 16px 16px;
          }

          .send-btn {
            height: 64px;
            font-size: 16px;
          }
        }
      `}</style>
    </main>
  );
}