// ─────────────────────────────────────────────────────────────────────────────
//  Clinic settings. Everything on the website comes from this file.
//  After editing, run:  node tools/build.mjs   (it rebuilds index.html)
// ─────────────────────────────────────────────────────────────────────────────

export default {
    // Shows a slim "demo clinic" notice at the top. Set to false for a real clinic.
    demo: true,

    name: 'Brightline Dental',
    // Short line under the name in the header and in search results.
    tagline: 'Family and cosmetic dentistry in Osu, Accra',
    // The big headline on the first screen.
    headline: 'Gentle dental care for the whole family',
    intro: 'Check-ups, fillings, whitening and braces, explained before we start and priced up front. Book on WhatsApp in under a minute.',

    // Optional logo image, e.g. 'assets/images/logo.png'. Leave empty to use the tooth mark.
    logo: '',
    // Main colour (buttons, links, headings accents). Any CSS colour works.
    brand: '#1d5bd8',
    // Second colour for highlights (glows, ticks, the shade guide). Any CSS colour works.
    accent: '#14b8a6',

    // Star rating shown in the hero (from Google reviews, for example). Remove to hide.
    rating: { score: 4.9, count: 210, source: 'Google reviews' },

    // Figures under the hero. These are samples: use the clinic's real numbers.
    stats: [
        { value: 12, suffix: '+', label: 'Years caring for smiles' },
        { value: 8000, suffix: '+', label: 'Patients treated' },
        { value: 4.9, decimals: 1, label: 'Average rating' },
        { value: 6, label: 'Days open every week' },
    ],

    // Interactive whitening shade guide. Set to false to hide it.
    shadeGuide: true,

    // Website address once it is live (used for sharing previews). Optional.
    url: 'https://ohenemanaf.github.io/dentist/',

    contact: {
        phone: '030 000 0000',             // shown as written
        whatsapp: '233200000000',          // country code + number, digits only. Empty = no WhatsApp
        email: 'hello@example.com',
        address: '12 Example Street, Osu, Accra',
        landmark: 'Opposite the sample pharmacy, two minutes from Oxford Street',
        mapQuery: 'Osu, Accra, Ghana',     // what Google Maps should search for
    },

    // Opening hours, 24-hour clock. Use null for closed days.
    timeZone: 'Africa/Accra',
    hours: {
        mon: ['08:00', '18:00'],
        tue: ['08:00', '18:00'],
        wed: ['08:00', '18:00'],
        thu: ['08:00', '18:00'],
        fri: ['08:00', '18:00'],
        sat: ['09:00', '14:00'],
        sun: null,
    },
    emergency: 'Toothache or a broken tooth? Call us. We keep same-day slots for emergencies.',

    currency: 'GH₵',
    // group: the filter it appears under (any words). icon: any name from assets/icons.svg (see README). price: a number, or text such as 'Free'.
    // from: true shows "from" before the price.
    services: [
        { icon: 'stethoscope', group: 'General', name: 'Check-up and consultation', price: 150, text: 'A full examination, advice, and a written treatment plan with prices.' },
        { icon: 'sparkles', group: 'General', name: 'Scaling and polishing', price: 400, text: 'Removes tartar and stains. Recommended every six months.' },
        { icon: 'shield-check', group: 'General', name: 'Tooth-coloured fillings', price: 350, from: true, text: 'Repairs cavities with a filling that matches your tooth.' },
        { icon: 'syringe', group: 'General', name: 'Extractions', price: 300, from: true, text: 'Simple and surgical removals, including wisdom teeth, under local anaesthetic.' },
        { icon: 'heart-pulse', group: 'General', name: 'Root canal treatment', price: 1500, from: true, text: 'Saves an infected tooth instead of removing it.' },
        { icon: 'smile', group: 'Cosmetic', name: 'Teeth whitening', price: 1800, text: 'In-clinic whitening, several shades lighter in one visit.' },
        { icon: 'crown', group: 'Cosmetic', name: 'Crowns and bridges', price: 2000, from: true, text: 'Restores broken or missing teeth with porcelain that looks natural.' },
        { icon: 'scan-face', group: 'Braces', name: 'Braces and aligners', price: 'Free', text: 'Free first assessment. Metal, ceramic and clear aligner options.' },
        { icon: 'baby', group: 'Children', name: 'Children’s dentistry', price: 120, text: 'Check-ups, fluoride and fissure sealants, at a pace that suits children.' },
    ],
    priceNote: 'Prices are a guide. You get a written quote before any treatment starts.',

    payment: ['Cash', 'Mobile Money', 'Visa and Mastercard', 'Selected health insurance'],

    // photo: optional, e.g. 'assets/images/dr-mensah.jpg' (square, about 400 × 400).
    team: [
        { name: 'Dr. Ama Sample', role: 'Principal dentist', text: 'General and cosmetic dentistry, with a special interest in nervous patients.' },
        { name: 'Dr. Kofi Example', role: 'Orthodontist', text: 'Braces and clear aligners for teenagers and adults.' },
        { name: 'Esi Placeholder', role: 'Dental hygienist', text: 'Cleanings, gum care and practical advice for keeping teeth healthy.' },
    ],

    // What happens at a first visit, in order.
    steps: [
        { title: 'Book', text: 'Send us a WhatsApp message or call. We confirm a time the same day.' },
        { title: 'Examination', text: 'We check your teeth and gums and explain what we find.' },
        { title: 'Your plan and price', text: 'You get a written plan with the cost of each option before anything starts.' },
        { title: 'Treatment', text: 'At a pace you are comfortable with. Tell us to pause at any time.' },
    ],

    // Short real reviews, with the patient's permission. These are samples.
    reviews: [
        { name: 'Sample patient', text: 'They explained every step and the price before starting. No surprises.', rating: 5 },
        { name: 'Sample parent', text: 'My son was scared of dentists. Now he asks when his next visit is.', rating: 5 },
        { name: 'Sample patient', text: 'Booked on WhatsApp in the morning and was seen that afternoon for a toothache.', rating: 5 },
        { name: 'Sample patient', text: 'The whitening result looks natural, not fake. Friends noticed straight away.', rating: 5 },
        { name: 'Sample patient', text: 'Clean, calm clinic and the staff remember your name.', rating: 5 },
        { name: 'Sample patient', text: 'Paid for my braces in instalments, which made it possible for us.', rating: 5 },
    ],

    faqs: [
        { q: 'Do I need an appointment?', a: 'Appointments are best, so you are not kept waiting. For emergencies, call and we will fit you in the same day.' },
        { q: 'Does treatment hurt?', a: 'We use local anaesthetic for anything that could be uncomfortable, and you can ask us to stop at any time.' },
        { q: 'Do you accept health insurance?', a: 'We accept selected insurance schemes. Send us the name of your scheme on WhatsApp and we will confirm before your visit.' },
        { q: 'From what age can children come?', a: 'From their first tooth. An early, relaxed visit makes later visits much easier.' },
        { q: 'Can I pay in instalments?', a: 'For larger treatments such as braces and crowns, we can agree a payment plan with you.' },
    ],

    social: {
        facebook: '',
        instagram: '',
        tiktok: '',
    },
};
