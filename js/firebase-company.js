// ==========================================================================
// ISHITECHNO PROJECTS — Company site Firebase hook
// Uses the SAME Firebase project as IshiTrackers ("ishitrackers"), but only
// ever reads/writes the top-level "enquiries" node — completely separate
// from tracker data (users/devices/locations/history/alerts/geofences).
// See /trackers/database.rules.json for the security rules covering this node.
// ==========================================================================

const companyFirebaseConfig = {
  apiKey:            "AIzaSyBsyw72Pt2jxcuzSzA_qh6uvbe7EWegZIg",
  authDomain:        "ishitrackers.firebaseapp.com",
  databaseURL:       "https://ishitrackers-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "ishitrackers",
  storageBucket:     "ishitrackers.firebasestorage.app",
  messagingSenderId: "388581548889",
  appId:             "1:388581548889:web:41d4eb28d6a2fa7e176248"
};

if (!firebase.apps.length) {
  firebase.initializeApp(companyFirebaseConfig);
}
const companyDb = firebase.database();

/**
 * Write an enquiry to /enquiries/{pushId}. Never touches any other node.
 * @param {string} source - which page/section the enquiry came from (school|college|business|iot|robotics|contact)
 * @param {object} data - form fields (already validated by the caller)
 */
function submitEnquiry(source, data) {
  const payload = Object.assign({}, data, {
    source: source,
    status: "new",
    createdAt: Date.now()
  });
  return companyDb.ref("enquiries").push(payload);
}
