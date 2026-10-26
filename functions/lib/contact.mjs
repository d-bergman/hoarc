export function validateContact(input) {
  if (!input || typeof input !== 'object') throw new Error('Please complete the form.');
  const fields = { name: 120, email: 254, phone: 40, subject: 120, message: 5000 };
  const result = {};
  for (const [key, max] of Object.entries(fields)) {
    const value = input[key] ?? '';
    if (typeof value !== 'string' || value.length > max || (key !== 'message' && /[\r\n\x00]/.test(value))) throw new Error(`Please check your ${key}.`);
    result[key] = value.trim();
  }
  if (!result.name || !result.subject || !result.message || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(result.email)) throw new Error('Enter your name, a valid email address, subject, and message.');
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
