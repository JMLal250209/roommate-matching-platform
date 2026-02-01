export default function SignIn() {
  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Welcome Back</h1>

      <p>Please sign in to your account.</p>

      <div style={{ marginTop: "20px" }}>
        <div style={{ marginBottom: "10px" }}>
          <label>Email</label><br />
          <input type="email" placeholder="you@example.com" />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Password</label><br />
          <input type="password" placeholder="••••••••" />
        </div>

        <button>Sign In</button>
      </div>
    </div>
  );
}
