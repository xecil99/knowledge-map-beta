// auth.js
export function initAuthUI({ supabase }) {
    const btnLogin = document.getElementById("btnLogin");
    const btnLogout = document.getElementById("btnLogout");
    const authStatus = document.getElementById("authStatus");
    const emailEl = document.getElementById("authEmail");
    const passEl = document.getElementById("authPassword");
    const btnSignup = document.getElementById("btnSignup");
    console.log("btnSignup is", document.getElementById("btnSignup"));


  function setUI(user) {
    if (user) {
      btnLogin.style.display = "none";
      btnLogout.style.display = "";
      authStatus.textContent = "Signed in";
    } else {
      btnLogin.style.display = "";
      btnLogout.style.display = "none";
      authStatus.textContent = "Viewing (not signed in)";
    }
  }

  // On page load, Supabase will auto-detect the OAuth redirect and store a session.
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) console.error("getSession error:", error);
    setUI(data?.session?.user || null);
  });

  supabase.auth.getSession().then(({ data }) => console.log("SESSION:", data.session));

  supabase.auth.onAuthStateChange((_event, session) => {
    setUI(session?.user || null);
  });

  btnSignup?.addEventListener("click", async () => {
    console.log("BEFORE authStatus:", authStatus?.textContent);
authStatus.textContent = "Signup button clicked";
console.log("AFTER authStatus:", authStatus?.textContent);

    authStatus.textContent = "Signup button clicked";
  const email = emailEl?.value?.trim();
  const password = passEl?.value;

  if (!email || !password) {
    authStatus.textContent = "Enter email and password.";
    return;
  }

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    authStatus.textContent = `Sign-up failed: ${error.message}`;
    return;
  }

  authStatus.textContent = "Check your email to confirm your account.";
});

  btnLogin?.addEventListener("click", async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: window.location.origin + window.location.pathname,
      },
    });

    if (error) {
      console.error("signInWithOAuth error:", error);
      authStatus.textContent = `Sign-in failed: ${error.message}`;
      return;
    }

    // Some environments require manual navigation to the returned URL.
    if (data?.url) window.location.assign(data.url);
  });

  btnLogout?.addEventListener("click", async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("signOut error:", error);
      authStatus.textContent = "Sign-out failed.";
      return;
    }
    setUI(null);
  });
}
