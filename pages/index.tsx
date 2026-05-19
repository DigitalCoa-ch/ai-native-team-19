import type { NextPage } from 'next';
import Head from 'next/head';

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>Day 1 Lab Worksheet - AI Native Enterprise</title>
        <meta name="description" content="AI Native Enterprise Week - Bachelor 3-Person Team Edition" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main style={styles.page}>
        <header style={styles.header}>
          <div style={styles.badge}>3-Person Team Edition</div>
          <h1 style={styles.title}>Day 1 Lab Worksheet</h1>
          <p style={styles.subtitle}>AI Native Enterprise - Bachelor</p>
        </header>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>How to Use This Worksheet</h2>
          <ul style={styles.list}>
            <li>Work on a <strong>single shared worksheet</strong> (pick one of the team members files).</li>
            <li>Work together in the same file as a team.</li>
            <li>All members must submit individually a copy of the final group work, ensuring the <strong>Individual Contributions</strong> section is updated.</li>
          </ul>
          <div style={styles.callout}>
            <span>💡</span>
            <div><strong>Technical tools</strong> - OpenClaw, GitHub, Vercel, Supabase, Stitch, APIs, and connectors are best-case pathways. They are useful, but <em>technical complexity is not the grade by itself</em>.</div>
          </div>
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>Suggested Role Split</h2>
          <div style={styles.roleGrid}>
            <div style={styles.roleCard}>
              <div style={styles.roleLabel}>A</div>
              <div style={styles.roleArea}>Business Logic</div>
              <div style={styles.roleFocus}>User, problem, AI-native logic, value</div>
              <div style={styles.roleNote}>A does not work alone</div>
            </div>
            <div style={styles.roleCard}>
              <div style={styles.roleLabel}>B</div>
              <div style={styles.roleArea}>Workflow and Risk</div>
              <div style={styles.roleFocus}>Steps, HITL, dependency, governance</div>
              <div style={styles.roleNote}>B does not own all risk decisions alone</div>
            </div>
            <div style={styles.roleCard}>
              <div style={styles.roleLabel}>C</div>
              <div style={styles.roleArea}>Prototype and Tools</div>
              <div style={styles.roleFocus}>Mockup, OpenClaw, GitHub, Vercel, Supabase, screenshots</div>
              <div style={styles.roleNote}>C is not graded only on technology</div>
            </div>
          </div>
        </section>

        <RequiredCore title="Team, User, Problem and Concept Direction">
          <Field label="Team Name and Members (A / B / C roles)">
            <strong>Mert:</strong> A, C &nbsp;|&nbsp; <strong>Anderson:</strong> B, C
          </Field>
          <Field label="Specialization or Track">International Finance</Field>
          <Field label="Working Concept Title">
            <span style={styles.highlight}>Wealth Health Agent</span>
          </Field>
          <Field label="Who is the intended user or customer? Be specific.">
            Students and young professionals who are seeking to build long-term wealth and manage their finances better.
          </Field>
          <Field label="What problem or opportunity are you addressing?">
            The AI Wealth Health Agent addresses the lack of accessible and personalized financial guidance by helping young adults and professionals better manage their spending, savings, debt, and long-term financial health through AI-generated insights and recommendations.
          </Field>
          <Field label="Why does this problem matter in your specialization?">
            This problem has crucial importance in our specialization because it shows us that consultancy and wealth management can be delivered to every individual at a lower price.
          </Field>
        </RequiredCore>

        <RequiredCore title="Access to Your AI Lab Tools">
          <Field label="OpenClaw Workbench Access Token and URL">
            <code style={styles.code}>Openclaw-secret-token-2026</code><br />
            <a href="https://ai-native-19.digitalcoa.ch/chat?session=main" style={styles.link} target="_blank" rel="noopener noreferrer">https://ai-native-19.digitalcoa.ch/chat?session=main</a>
          </Field>
          <Field label="GitHub Repository URL">
            <a href="https://github.com/DigitalCoa-ch/ai-native-team-19" style={styles.link} target="_blank" rel="noopener noreferrer">github.com/DigitalCoa-ch/ai-native-team-19</a>
          </Field>
          <Field label="Final Prototype URL">
            <a href="https://team-19.apps.digitalcoa.ch" style={styles.link} target="_blank" rel="noopener noreferrer">team-19.apps.digitalcoa.ch</a>
          </Field>
        </RequiredCore>

        <RequiredCore title="AI-Native Logic and Oxygen Test">
          <div style={styles.fillGap}>
            We are designing a <em>Wealth Health Agent</em> for <em>students and young professionals</em> because <em>they cannot afford to have a consultant</em>.
          </div>
          <Field label="What does AI do in this concept?">
            <div style={styles.tagRow}>
              <span style={styles.tag}>Generate</span>
              <span style={styles.tag}>Predict</span>
              <span style={styles.tag}>Recommend</span>
              <span style={styles.tag}>Monitor</span>
            </div>
          </Field>
          <div style={styles.oxygenGrid}>
            <div style={{...styles.oxygenCard, borderLeft: '4px solid #2e9e6b'}}>
              <div style={styles.oxygenIcon}>✅</div>
              <div style={styles.oxygenQ}>If AI disappeared tomorrow, what would <strong>still work</strong>?</div>
              <div style={styles.oxygenA}>Manual tracking, budget rules, basic templates</div>
            </div>
            <div style={{...styles.oxygenCard, borderLeft: '4px solid #d94040'}}>
              <div style={styles.oxygenIcon}>⚠️</div>
              <div style={styles.oxygenQ}>If AI disappeared tomorrow, what would <strong>collapse</strong>?</div>
              <div style={styles.oxygenA}>Personalized insights, real-time recommendations, debt analysis</div>
            </div>
          </div>
          <Field label="Classify: AI-enabled, AI-first, or AI-native?">
            <strong>AI-First</strong> - The core product experience is AI-generated advice; AI is the primary value driver, not an add-on to a manual process.
          </Field>
          <Field label="One hidden dependency or fragility to watch:">
            Data quality and availability from financial data providers; reliance on third-party APIs for real-time market data.
          </Field>
        </RequiredCore>

        <RequiredCore title="End-of-Day Evidence Box">
          <Field label="Today we produced three concrete outputs:">
            <ol style={styles.olList}>
              <li>Defined problem space, user persona, and AI-native concept direction</li>
              <li>Set up shared GitHub repository and OpenClaw workbench</li>
              <li>Published working prototype homepage on Vercel</li>
            </ol>
          </Field>
          <Field label="Tomorrow we need to clarify, fix, or build:">
            <ul style={styles.ulList}>
              <li>Refine AI capability stack (which model, which tools)</li>
              <li>Draft first workflow with human-in-the-loop checkpoints</li>
              <li>Connect OpenClaw to prototype for live demo</li>
            </ul>
          </Field>
          <Field label="My main contribution today was:">
            <em>To be filled in by each team member individually.</em>
          </Field>
        </RequiredCore>

        <section style={styles.optCard}>
          <div style={styles.optTag}>Optional Support</div>
          <h2 style={styles.sectionTitle}>PERCH and Hidden Architecture</h2>
          <p style={styles.optHint}>Use if you have time or are stuck.</p>
          <div style={styles.perchGrid}>
            <div style={styles.perchItem}><strong>Perspective</strong><p>Whose assumptions are shaping this concept?</p><div style={styles.perchAns}>Young professionals who already use fintech apps (Robinhood, Revolut, etc.) and are comfortable with AI-assisted decisions.</div></div>
            <div style={styles.perchItem}><strong>Evidence</strong><p>What do we know, and what are we only assuming?</p><div style={styles.perchAns}><em>Know:</em> High demand for low-cost financial advice. <em>Assume:</em> Users will trust AI-generated financial advice.</div></div>
            <div style={styles.perchItem}><strong>Reasoning</strong><p>Are we jumping from idea to conclusion?</p><div style={styles.perchAns}>We assume AI recommendation quality is sufficient without validating against a financial expert baseline.</div></div>
            <div style={styles.perchItem}><strong>Context and Hypotheses</strong><p>What market reality could weaken the idea?</p><div style={styles.perchAns}>Regulatory constraints on financial advice in certain jurisdictions; users may prefer human advisors for major decisions.</div></div>
            <div style={styles.perchItem}><strong>Visible Surface</strong><p>What will users see?</p><div style={styles.perchAns}>A chat-like interface or dashboard where users input financial data and receive AI-generated insights and recommendations.</div></div>
            <div style={styles.perchItem}><strong>Hidden Architecture</strong><p>What work, data, partners, APIs, or people are behind the surface?</p><div style={styles.perchAns}>LLM API for reasoning, bank account aggregation via Plaid, financial data normalization pipeline, human review loop for high-risk advice.</div></div>
          </div>
        </section>

        <section style={styles.optCard}>
          <div style={styles.optTag}>Optional Support</div>
          <h2 style={styles.sectionTitle}>Prototype Direction Preview</h2>
          <p style={styles.optHint}>Not a build task yet - a thinking tool.</p>
          <div style={styles.protoTable}>
            <div style={styles.protoRow}><span>Web page or landing page</span><span style={styles.protoDone}>✅ In progress</span></div>
            <div style={styles.protoRow}><span>AI assistant or chatbot</span><span style={styles.protoNext}>Next step</span></div>
            <div style={styles.protoRow}><span>Form + AI output</span><span style={styles.protoPlanned}>Planned</span></div>
            <div style={styles.protoRow}><span>Dashboard</span><span style={styles.protoPlanned}>Planned</span></div>
            <div style={styles.protoRow}><span>OpenClaw-built web prototype</span><span style={styles.protoDone}>✅ Live</span></div>
          </div>
          <div style={styles.protoDemo}>
            <strong>Smallest visible demo:</strong> A user inputs <em>their monthly income and expenses</em> and the system produces <em>personalized budget categories and spending recommendations</em> so that <em>they can make better financial decisions without a consultant</em>.
          </div>
          <div style={styles.tagRow}>
            <strong style={{fontSize: '0.85rem', color: '#6b7d93'}}>First tools:</strong>
            <span style={styles.tag}>OpenClaw</span>
            <span style={styles.tag}>Vercel</span>
            <span style={styles.tag}>GitHub</span>
            <span style={styles.tag}>Stitch</span>
          </div>
        </section>

        <footer style={styles.footer}>
          <p>AI Native Enterprise Week - Team 19 - International Finance Track</p>
          <p>OpenClaw Workbench: <a href="https://ai-native-19.digitalcoa.ch" style={styles.link}>ai-native-19.digitalcoa.ch</a></p>
        </footer>
      </main>
    </>
  );
};

const RequiredCore: React.FC<{title: string; children: React.ReactNode}> = ({ title, children }) => (
  <section style={styles.card}>
    <div style={styles.coreTag}>Required Core</div>
    <h2 style={styles.sectionTitle} dangerouslySetInnerHTML={{__html: title}} />
    {children}
  </section>
);

const Field: React.FC<{label: string; children: React.ReactNode}> = ({ label, children }) => (
  <div style={{marginBottom: '16px'}}>
    <label style={{display: 'block', fontSize: '0.78rem', fontWeight: '700', color: '#6b7d93', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px'}}>{label}</label>
    <div style={{fontSize: '0.95rem', lineHeight: '1.55'}}>{children}</div>
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', backgroundColor: '#f0f4f8', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#1e2a38', padding: '24px 16px 48px' },
  header: { textAlign: 'center', marginBottom: '32px' },
  badge: { display: 'inline-block', backgroundColor: '#3b6ea5', color: '#fff', fontSize: '0.75rem', fontWeight: '700', padding: '4px 14px', borderRadius: '99px', marginBottom: '12px', letterSpacing: '0.04em', textTransform: 'uppercase' },
  title: { fontSize: '2rem', fontWeight: '800', color: '#1e2a38', marginBottom: '6px' },
  subtitle: { fontSize: '1rem', color: '#6b7d93' },
  card: { backgroundColor: '#fff', borderRadius: '14px', padding: '24px 26px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(30,42,56,0.08)', border: '1px solid #d8e2ec' },
  optCard: { backgroundColor: '#f8fafc', borderRadius: '14px', padding: '24px 26px', marginBottom: '20px', border: '1px dashed #b0bec5' },
  coreTag: { display: 'inline-block', backgroundColor: '#e8f0fb', color: '#3b6ea5', fontSize: '0.72rem', fontWeight: '700', padding: '3px 10px', borderRadius: '6px', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  optTag: { display: 'inline-block', backgroundColor: '#f0f0f0', color: '#6b7d93', fontSize: '0.72rem', fontWeight: '700', padding: '3px 10px', borderRadius: '6px', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  sectionTitle: { fontSize: '1.15rem', fontWeight: '700', color: '#1e2a38', marginBottom: '18px', paddingBottom: '10px', borderBottom: '2px solid #f0f4f8' },
  list: { paddingLeft: '20px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.95rem', lineHeight: '1.5' },
  callout: { display: 'flex', alignItems: 'flex-start', gap: '12px', backgroundColor: '#e8f0fb', borderRadius: '10px', padding: '14px 16px', marginTop: '8px' },
  roleGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' },
  roleCard: { backgroundColor: '#f8fafc', borderRadius: '10px', padding: '16px', border: '1px solid #d8e2ec', textAlign: 'center' },
  roleLabel: { display: 'inline-block', width: '36px', height: '36px', lineHeight: '36px', backgroundColor: '#3b6ea5', color: '#fff', borderRadius: '50%', fontWeight: '800', fontSize: '1rem', marginBottom: '10px' },
  roleArea: { fontWeight: '700', fontSize: '0.95rem', marginBottom: '4px' },
  roleFocus: { fontSize: '0.82rem', color: '#6b7d93' },
  roleNote: { fontSize: '0.78rem', color: '#3b6ea5', marginTop: '8px', fontStyle: 'italic' },
  highlight: { background: '#e8f0fb', padding: '2px 10px', borderRadius: '6px', fontWeight: '700', color: '#3b6ea5' },  code: { background: '#f0f4f8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.88rem' },
  link: { color: '#3b6ea5', textDecoration: 'none', fontWeight: '500' },
  tag: { background: '#e8f0fb', color: '#3b6ea5', padding: '3px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' },
  tagRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px', alignItems: 'center' },
  fillGap: { background: '#f0f4f8', borderRadius: '10px', padding: '16px 18px', marginBottom: '20px', fontSize: '0.95rem' },
  oxygenGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' },
  oxygenCard: { backgroundColor: '#f8fafc', borderRadius: '10px', padding: '16px', border: '1px solid #d8e2ec' },
  oxygenIcon: { fontSize: '1.2rem', marginBottom: '6px' },
  oxygenQ: { fontSize: '0.88rem', fontWeight: '600', marginBottom: '4px' },
  oxygenA: { fontSize: '0.85rem', color: '#1e2a38' },
  olList: { paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' },
  ulList: { paddingLeft: '20px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' },
  optHint: { fontSize: '0.85rem', color: '#6b7d93', marginBottom: '18px' },
  perchGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' },
  perchItem: { backgroundColor: '#fff', borderRadius: '10px', padding: '14px 16px', border: '1px solid #d8e2ec' },
  perchAns: { fontSize: '0.85rem', color: '#6b7d93', marginTop: '6px', lineHeight: '1.5' },
  protoTable: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' },
  protoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #d8e2ec' },
  protoDone: { background: '#e2f5ed', color: '#2e9e6b', padding: '2px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' },
  protoNext: { background: '#fef3e2', color: '#e07b2a', padding: '2px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' },
  protoPlanned: { background: '#f0f4f8', color: '#6b7d93', padding: '2px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' },
  protoDemo: { background: '#e8f0fb', borderRadius: '10px', padding: '16px 18px', fontSize: '0.9rem', marginBottom: '14px', lineHeight: '1.5' },
  footer: { textAlign: 'center', padding: '32px 16px 16px', borderTop: '2px solid #d8e2ec', marginTop: '16px' },
};

export default Home;
