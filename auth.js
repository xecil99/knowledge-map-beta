// auth.js
export function initAuthUI({ supabase }) {
  const btnLogin = document.getElementById("btnLogin");
  const btnLogout = document.getElementById("btnLogout");
  const authStatus = document.getElementById("authStatus");

  function setUI(user) {
    if (user) {
      btnLogin.style.display = "none";
      btnLogout.style.display = "";
      authStatus.textContent = `Signed in`;
    } else {
      btnLogin.style.display = "";
      btnLogout.style.display = "none";
      authStatus.textContent = "Viewing (not signed in)";
    }
  }

  btnLogin?.addEventListener("click", async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: window.location.href,
      },
    });
    if (error) {
      console.error(error);
      authStatus.textContent = "Sign-in failed.";
    }
  });

  btnLogout?.addEventListener("click", async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error(error);
      authStatus.textContent = "Sign-out failed.";
      return;
    }
    setUI(null);
  });

  // initial state + updates
  supabase.auth.getUser().then(({ data }) => setUI(data?.user || null));
  supabase.auth.onAuthStateChange((_event, session) =>
    setUI(session?.user || null)
  );
}
