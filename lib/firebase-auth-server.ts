type FirebaseLookupUser = {
  localId: string;
  email?: string;
  displayName?: string;
  photoUrl?: string;
};

type FirebaseLookupResponse = {
  users?: FirebaseLookupUser[];
  error?: {
    message?: string;
  };
};

export async function verifyFirebaseIdToken(idToken: string) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing NEXT_PUBLIC_FIREBASE_API_KEY in environment.");
  }

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ idToken })
  });

  const payload = (await response.json()) as FirebaseLookupResponse;

  if (!response.ok || !payload.users?.length) {
    throw new Error(payload.error?.message ?? "Invalid Firebase ID token");
  }

  const user = payload.users[0];
  if (!user?.localId || !user?.email) {
    throw new Error("Firebase account payload is missing required fields.");
  }

  return {
    uid: user.localId,
    email: user.email,
    name: user.displayName ?? null,
    image: user.photoUrl ?? null
  };
}