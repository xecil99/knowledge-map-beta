// auth.js
export function initAuthUI({ supabase }) {
    console.log("initAuthUI loaded", {
    hasBtnLogin: !!document.getElementById("btnLogin"),
    hasAuth: !!supabase?.auth,
    });
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
  console.log("Sign-in clicked", window.location.href);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: window.location.origin + window.location.pathname,
    },
  });

  console.log("signInWithOAuth result", { data, error });

  if (data?.url) {
  window.location.assign(data.url);
  return;
}

  if (error) {
    console.error(error);
    authStatus.textContent = `Sign-in failed: ${error.message}`;
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
