'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function BookPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  // Where an enquiry goes if the form itself can't deliver it. Also the
  // address Formspree sends to, which is set in the Formspree dashboard for
  // form xyyaedyo rather than here - nothing in this file can change it.
  const CONTACT_EMAIL = 'info@bentims.com';

  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === 'sending') return;
    setState('sending');

    // Every outcome has to say something. A booking enquiry that quietly
    // fails - Formspree over its monthly quota, the form paused, no
    // connection - used to leave the visitor looking at a filled-in form
    // with no idea whether it had been sent, which is a lost enquiry rather
    // than a delayed one. The fields are kept on failure so nothing is
    // retyped, and the message offers the email address directly.
    try {
      const response = await fetch('https://formspree.io/f/xyyaedyo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        console.error('Formspree rejected the booking form:', response.status);
        setState('failed');
        return;
      }
      setState('sent');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setState((s) => (s === 'sent' ? 'idle' : s)), 5000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setState('failed');
    }
  };

  return (
    <div className="w-full">
      <div className="px-6 py-12 md:px-[50px]">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h1 className="text-4xl font-800 mb-4" style={{color: 'var(--ink)', textTransform: 'lowercase'}}>Book a Shoot</h1>
            <p className="text-lg opacity-75" style={{color: 'var(--dim)'}}>
              Have a project in mind? I'd love to hear from you. Fill out the form below and I'll get back to you shortly.
            </p>
          </motion.div>

          {state === 'sent' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 rounded-lg"
              style={{
                backgroundColor: 'var(--bg-elev)',
                borderColor: 'var(--accent)',
                color: 'var(--ink)',
                borderWidth: '1px'
              }}
            >
              ✓ Message sent! I'll be in touch soon.
            </motion.div>
          )}

          {state === 'failed' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 rounded-lg"
              style={{
                backgroundColor: 'var(--bg-elev)',
                borderColor: 'var(--ink)',
                color: 'var(--ink)',
                borderWidth: '1px',
              }}
            >
              That didn&apos;t send - nothing has been lost, your message is still below. Please try
              again, or email me directly at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--accent)' }}>
                {CONTACT_EMAIL}
              </a>
              .
            </motion.div>
          )}

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div>
              <label htmlFor="name" className="block text-sm font-700 mb-2" style={{color: 'var(--ink)', textTransform: 'lowercase'}}>
                Name
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
                required
                className="w-full px-4 py-3 md:py-3 rounded-lg focus:outline-none transition text-base"
              style={{
                backgroundColor: 'var(--bg-elev)',
                borderColor: 'var(--line-input)',
                color: 'var(--ink)',
                borderWidth: '1px',
                boxShadow: 'inset 0 0 0 2px transparent'
              }}
              onFocus={(e) => e.target.style.boxShadow = 'inset 0 0 0 2px var(--focus)'}
              onBlur={(e) => e.target.style.boxShadow = 'inset 0 0 0 2px transparent'}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-700 mb-2" style={{color: 'var(--ink)', textTransform: 'lowercase'}}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3 md:py-3 rounded-lg focus:outline-none transition text-base"
              style={{
                backgroundColor: 'var(--bg-elev)',
                borderColor: 'var(--line-input)',
                color: 'var(--ink)',
                borderWidth: '1px',
                boxShadow: 'inset 0 0 0 2px transparent'
              }}
              onFocus={(e) => e.target.style.boxShadow = 'inset 0 0 0 2px var(--focus)'}
              onBlur={(e) => e.target.style.boxShadow = 'inset 0 0 0 2px transparent'}
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-700 mb-2" style={{color: 'var(--ink)', textTransform: 'lowercase'}}>
                Subject
              </label>
              <input
                id="subject"
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="What's this about?"
                required
                className="w-full px-4 py-3 md:py-3 rounded-lg focus:outline-none transition text-base"
              style={{
                backgroundColor: 'var(--bg-elev)',
                borderColor: 'var(--line-input)',
                color: 'var(--ink)',
                borderWidth: '1px',
                boxShadow: 'inset 0 0 0 2px transparent'
              }}
              onFocus={(e) => e.target.style.boxShadow = 'inset 0 0 0 2px var(--focus)'}
              onBlur={(e) => e.target.style.boxShadow = 'inset 0 0 0 2px transparent'}
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-700 mb-2" style={{color: 'var(--ink)', textTransform: 'lowercase'}}>
                Message
              </label>
              <textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Tell me about your project..."
                rows={6}
                required
                className="w-full px-4 py-3 rounded-lg focus:outline-none transition resize-none"
              style={{
                backgroundColor: 'var(--bg-elev)',
                borderColor: 'var(--line-input)',
                color: 'var(--ink)',
                borderWidth: '1px',
                boxShadow: 'inset 0 0 0 2px transparent'
              }}
              onFocus={(e) => e.target.style.boxShadow = 'inset 0 0 0 2px var(--focus)'}
              onBlur={(e) => e.target.style.boxShadow = 'inset 0 0 0 2px transparent'}
              />
            </div>

            <button
              type="submit"
              disabled={state === 'sending'}
              className="w-full font-800 py-4 md:py-3 rounded-lg cursor-pointer active:scale-95 transition-transform disabled:cursor-wait"
              style={{
                backgroundColor: 'var(--bg-elev)',
                color: 'var(--accent)',
                border: '1px solid var(--accent)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent)';
                e.currentTarget.style.color = 'var(--bg-elev)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-elev)';
                e.currentTarget.style.color = 'var(--accent)';
              }}
            >
              {state === 'sending' ? 'Sending...' : 'Send Message'}
            </button>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
