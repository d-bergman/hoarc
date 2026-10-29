export function validateContact(input) {
  if (!input || typeof input !== 'object') throw new Error('Please complete the form.');
  const fields = { firstName: 60, lastName: 60, email: 254, phone: 40, subject: 120, message: 5000 };
  const result = {};
  for (const [key, max] of Object.entries(fields)) {
    const value = input[key] ?? '';
    if (typeof value !== 'string' || value.length > max || (key !== 'message' && /[\r\n\x00]/.test(value))) throw new Error(`Please check your ${key}.`);
    result[key] = value.trim();
  }
  if (!result.firstName || !result.lastName || !result.subject || !result.message || !/^[^\s@<>,;:"()\\]+@[^\s@<>,;:"()\\]+\.[^\s@<>,;:"()\\]+$/.test(result.email)) throw new Error('Enter your first and last names, a valid email address, subject, and message.');
  result.name = `${result.firstName} ${result.lastName}`;
  if (input.consent !== true) throw new Error('Please agree to the privacy notice.');
  if (input.website) throw new Error('Unable to accept this submission.');
  return result;
}

export function contactMail(data, from, now = new Date()) {
  return {
    from,
    to: 'hoarc.church@gmail.com',
    replyTo: { name: data.name, address: data.email },
    subject: `HOARC Website Inquiry: ${data.subject}`,
    text: `Website inquiry\nReceived: ${now.toISOString()}\n\nName: ${data.name}\nEmail: ${data.email}\nTelephone: ${data.phone || 'Not supplied'}\nSubject: ${data.subject}\n\n${data.message}\n`,
  };
}

export async function verifyContactApp(token, verifyToken) {
  if (typeof token !== 'string' || !token || token.length > 8192) throw new Error('App verification required.');
  const verified = await verifyToken(token);
  if (verified.app_id !== '1:752902391273:web:ea9707b444ddc72c6d3778') throw new Error('Unrecognized app.');
}
