import { useState, useEffect } from 'react'
import axios from 'axios'

const EMOTION_COLORS = {
  angry:'#e94560', disgust:'#ff6b35', fear:'#ffd700',
  happy:'#00d4aa', sad:'#6c8ebf', surprise:'#b5ead7', neutral:'#c0c0c0',
}
const EMOTION_EMOJI = {
  angry:'😠', disgust:'🤢', fear:'😨', happy:'😄',
  sad:'😢', surprise:'😮', neutral:'😐',
}
const ATTENTIVE = new Set(['happy','neutral','surprise'])

function formatTime(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

function getVerdict(score) {
  if (score >= 85) return { text:'Excellent 🏆', color:'var(--green)' }
  if (score >= 70) return { text:'Good 👍',      color:'var(--green)' }
  if (score >= 50) return { text:'Fair ⚠️',      color:'var(--yellow)' }
  return              { text:'Needs Work 📚',    color:'var(--red)' }
}

function getAttentionLabel(pct) {
  if (pct >= 75) return { text:'Highly Attentive ✅',       color:'var(--green)' }
  if (pct >= 50) return { text:'Moderate Attention ⚠️',     color:'var(--yellow)' }
  return              { text:'Frequently Distracted 🚨',    color:'var(--red)' }
}


function SessionHistory({ onClose }) {
  const [logs,    setLogs]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

 
  useEffect(() => {
    axios.get('/api/logs')
      .then(res => { setLogs(res.data); setLoading(false) })
      .catch(() => { setError('Could not load session logs.'); setLoading(false) })
  }, [])

  return (
    <div style={M.overlay} onClick={onClose}>
      <div style={M.modal} onClick={e => e.stopPropagation()}>
        <div style={M.modalHeader}>
          <span style={{ fontWeight:'800', fontSize:'16px' }}>📋 All Session Logs</span>
          <button className="btn btn-accent" style={{ padding:'6px 16px', fontSize:'13px' }} onClick={onClose}>✕ Close</button>
        </div>

        {loading && <div style={M.msg}>⏳ Loading...</div>}
        {error   && <div style={{ ...M.msg, color:'var(--red)' }}>{error}</div>}

        {logs && logs.length === 0 && (
          <div style={M.msg}>No sessions recorded yet.</div>
        )}

        {logs && logs.length > 0 && (
          <div style={{ overflowX:'auto' }}>
            <table style={M.table}>
              <thead>
                <tr>
                  {['Date','Time','Student Name','Score (%)','Attention (%)','Dominant Emotion','Correct','Wrong','Time Taken (s)'].map(h => (
                    <th key={h} style={M.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((row, i) => {
                  const score     = Number(row['Test Score (%)'])
                  const attention = Number(row['Attention Score (%)'])
                  const verdict   = getVerdict(score)
                  const attLbl    = getAttentionLabel(attention)
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'var(--accent)' : 'transparent' }}>
                      <td style={M.td}>{row['Date']}</td>
                      <td style={M.td}>{row['Time']}</td>
                      <td style={{ ...M.td, fontWeight:'600', color:'var(--white)' }}>{row['Student Name']}</td>
                      <td style={{ ...M.td, color: verdict.color, fontWeight:'700' }}>{score}%</td>
                      <td style={{ ...M.td, color: attLbl.color,  fontWeight:'700' }}>
                        {row['Total Frames'] === '0' ? 'N/A' : `${attention}%`}
                      </td>
                      <td style={{ ...M.td, textTransform:'capitalize' }}>
                        {EMOTION_EMOJI[row['Dominant Emotion']] || ''} {row['Dominant Emotion']}
                      </td>
                      <td style={{ ...M.td, color:'var(--green)' }}>{row['Correct']}</td>
                      <td style={{ ...M.td, color:'var(--red)'   }}>{row['Wrong']}</td>
                      <td style={M.td}>{row['Time Taken (s)']}s</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const M = {
  overlay: {
    position:'fixed', inset:0, background:'rgba(0,0,0,0.7)',
    display:'flex', alignItems:'center', justifyContent:'center',
    zIndex:1000, padding:'20px',
  },
  modal: {
    background:'var(--panel)', borderRadius:'16px', width:'100%',
    maxWidth:'900px', maxHeight:'80vh', overflow:'auto',
    display:'flex', flexDirection:'column',
  },
  modalHeader: {
    display:'flex', justifyContent:'space-between', alignItems:'center',
    padding:'16px 20px', borderBottom:'1px solid rgba(255,255,255,0.08)',
    position:'sticky', top:0, background:'var(--panel)', zIndex:1,
  },
  msg:   { padding:'32px', textAlign:'center', color:'var(--subtext)' },
  table: { width:'100%', borderCollapse:'collapse', fontSize:'13px' },
  th:    { padding:'10px 14px', textAlign:'left', color:'var(--subtext)', fontWeight:'700',
           fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.4px',
           borderBottom:'1px solid rgba(255,255,255,0.08)', whiteSpace:'nowrap' },
  td:    { padding:'10px 14px', color:'var(--subtext)', whiteSpace:'nowrap' },
}



export default function ResultScreen({ result, studentName, onRetry }) {
  const [showHistory, setShowHistory] = useState(false)

  const {
    correct = 0, wrong = 0, attempted = 0, unattempted = 0,
    total = 10, score_pct = 0, time_taken = 0,
    emotion_counts = {}, csv_saved = false, csv_path = '',
    details = [],
  } = result || {}

  const totalFrames     = Object.values(emotion_counts).reduce((a,b)=>a+b,0)
  const attentiveFrames = Object.entries(emotion_counts)
    .filter(([e]) => ATTENTIVE.has(e))
    .reduce((a,[,v])=>a+v, 0)
  const attentionPct    = totalFrames > 0 ? Math.round((attentiveFrames/totalFrames)*100) : 0

  
  const dominantEmotion = totalFrames > 0
    ? Object.entries(emotion_counts).sort((a,b)=>b[1]-a[1])[0]?.[0]
    : 'N/A'

  const verdict  = getVerdict(score_pct)
  const attLabel = getAttentionLabel(attentionPct)

  return (
    <div style={S.page} className="fade-in">
      {showHistory && <SessionHistory onClose={() => setShowHistory(false)} />}

     
      <header style={S.header}>
        <span style={{ fontSize:'20px', fontWeight:'800' }}>📊 Session Report — {studentName}</span>
        <div style={{ display:'flex', gap:'10px' }}>
          <button className="btn btn-green" onClick={() => setShowHistory(true)}>📋 View All Sessions</button>
          <button className="btn btn-accent" onClick={onRetry}>🔄 New Test</button>
        </div>
      </header>

      <div style={S.body}>

       
        <div style={S.statRow}>
          <StatCard icon="🎯" label="Test Score"  value={`${score_pct}%`}    color={verdict.color} />
          <StatCard icon="✅" label="Correct"     value={correct}            color="var(--green)" />
          <StatCard icon="❌" label="Wrong"       value={wrong}              color="var(--red)" />
          <StatCard icon="⏭️" label="Unattempted" value={unattempted}        color="var(--subtext)" />
          <StatCard icon="👁️" label="Attention"   value={totalFrames > 0 ? `${attentionPct}%` : 'N/A'} color={attLabel.color} />
          <StatCard icon="⏱️" label="Time Taken"  value={formatTime(time_taken)} color="var(--yellow)" />
        </div>

       
        <div style={S.row2}>
          <div style={S.verdictCard}>
            <div style={S.verdictLabel}>Overall Verdict</div>
            <div style={{ ...S.verdictVal, color: verdict.color }}>{verdict.text}</div>
            <div style={S.verdictSub}>{attLabel.text}</div>
            {totalFrames === 0 && (
              <div style={{ ...S.csvNote, background:'rgba(233,69,96,0.1)', color:'var(--red)' }}>
                ⚠️ No emotion frames captured — camera may not have been detected.
              </div>
            )}
            {csv_saved && (
              <div style={S.csvNote}>
                💾 Report saved to: <code style={S.csvPath}>{csv_path}</code>
              </div>
            )}
          </div>

          
          <div style={S.emoCard}>
            <div style={S.sectionTitle}>Emotion Distribution</div>
            {totalFrames === 0 ? (
              <div style={{ color:'var(--subtext)', fontSize:'13px', textAlign:'center', padding:'20px 0' }}>
                No emotion data — camera was not active or face was not detected.
              </div>
            ) : (
              Object.entries(emotion_counts)
                .sort((a,b) => b[1]-a[1])
                .map(([em, cnt]) => {
                  const pct = Math.round((cnt/totalFrames)*100)
                  return (
                    <div key={em} style={S.barRow}>
                      <span style={S.barLabel}>
                        {EMOTION_EMOJI[em]} {em}
                        {em === dominantEmotion && (
                          <span style={{ marginLeft:'6px', fontSize:'10px',
                            color:'var(--green)', fontWeight:'700' }}>★ dominant</span>
                        )}
                      </span>
                      <div style={S.barTrack}>
                        <div style={{ ...S.barFill, width:`${pct}%`, background:EMOTION_COLORS[em] }} />
                      </div>
                      <span style={S.barPct}>{cnt} ({pct}%)</span>
                    </div>
                  )
                })
            )}
          </div>
        </div>

        
        <div style={S.reviewCard}>
          <div style={S.sectionTitle}>📋 Question-wise Review</div>
          <div style={S.reviewGrid}>
            {details.map((d, i) => (
              <div key={d.id} style={{
                ...S.reviewItem,
                borderLeft: `4px solid ${
                  d.is_correct === true  ? 'var(--green)' :
                  d.is_correct === false ? 'var(--red)'   : 'var(--subtext)'
                }`,
              }}>
                <div style={S.reviewQ}>
                  <span style={S.reviewNum}>Q{i+1}</span>
                  <span style={S.reviewSubj}>
                    {d.question.length > 55 ? d.question.slice(0,55)+'…' : d.question}
                  </span>
                </div>
                <div style={S.reviewAns}>
                  <span style={{ color: d.is_correct ? 'var(--green)' : 'var(--red)', fontSize:'12px' }}>
                    Your: {d.user_answer ?? '—'}
                  </span>
                  {!d.is_correct && d.user_answer && (
                    <span style={{ color:'var(--green)', fontSize:'12px' }}>✓ {d.correct_answer}</span>
                  )}
                  <span style={{
                    fontSize:'12px', fontWeight:'700',
                    color: d.is_correct === true  ? 'var(--green)' :
                           d.is_correct === false ? 'var(--red)'   : 'var(--subtext)',
                  }}>
                    {d.is_correct === true ? '✅' : d.is_correct === false ? '❌' : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={S.statCard}>
      <div style={{ fontSize:'24px' }}>{icon}</div>
      <div style={{ fontSize:'26px', fontWeight:'800', color }}>{value}</div>
      <div style={{ fontSize:'12px', color:'var(--subtext)', fontWeight:'600' }}>{label}</div>
    </div>
  )
}

const S = {
  page:    { minHeight:'100vh', display:'flex', flexDirection:'column', background:'var(--bg)' },
  header:  { display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--accent)', padding:'14px 28px' },
  body:    { padding:'24px', display:'flex', flexDirection:'column', gap:'20px' },

  statRow: { display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:'12px' },
  statCard:{ background:'var(--panel)', borderRadius:'12px', padding:'18px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:'6px' },

  row2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' },

  verdictCard: { background:'var(--panel)', borderRadius:'12px', padding:'24px', display:'flex', flexDirection:'column', gap:'10px' },
  verdictLabel:{ fontSize:'12px', color:'var(--subtext)', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.5px' },
  verdictVal:  { fontSize:'28px', fontWeight:'800' },
  verdictSub:  { fontSize:'15px', color:'var(--subtext)' },
  csvNote:     { marginTop:'12px', padding:'10px 14px', background:'rgba(0,212,170,0.08)', borderRadius:'8px', fontSize:'12px', color:'var(--green)' },
  csvPath:     { fontFamily:'monospace', fontSize:'11px', color:'var(--white)', wordBreak:'break-all', display:'block', marginTop:'4px' },

  emoCard:     { background:'var(--panel)', borderRadius:'12px', padding:'20px' },
  sectionTitle:{ fontSize:'13px', fontWeight:'700', color:'var(--subtext)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'14px' },
  barRow:      { display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' },
  barLabel:    { fontSize:'13px', width:'130px', color:'var(--white)', textTransform:'capitalize', display:'flex', alignItems:'center' },
  barTrack:    { flex:1, height:'8px', background:'rgba(255,255,255,0.08)', borderRadius:'4px', overflow:'hidden' },
  barFill:     { height:'100%', borderRadius:'4px', transition:'width 0.5s' },
  barPct:      { fontSize:'12px', color:'var(--subtext)', width:'80px', textAlign:'right' },

  reviewCard:  { background:'var(--panel)', borderRadius:'12px', padding:'20px' },
  reviewGrid:  { display:'flex', flexDirection:'column', gap:'10px', marginTop:'4px' },
  reviewItem:  { background:'var(--accent)', borderRadius:'8px', padding:'12px 16px', display:'flex', flexDirection:'column', gap:'6px' },
  reviewQ:     { display:'flex', alignItems:'flex-start', gap:'10px' },
  reviewNum:   { fontSize:'12px', fontWeight:'700', color:'var(--subtext)', flexShrink:0, paddingTop:'2px' },
  reviewSubj:  { fontSize:'14px', color:'var(--white)', lineHeight:'1.4' },
  reviewAns:   { display:'flex', gap:'16px', alignItems:'center', flexWrap:'wrap', paddingLeft:'28px' },
}
