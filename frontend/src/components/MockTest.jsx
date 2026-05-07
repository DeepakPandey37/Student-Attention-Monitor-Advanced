import { useState, useEffect, useRef, useCallback } from 'react'
import { fetchQuestions, analyzeFrame, submitTest } from '../services/api'

const TIMER_SECONDS = 600  

const EMOTION_COLORS = {
  angry: '#e94560', disgust: '#ff6b35', fear: '#ffd700',
  happy: '#00d4aa', sad: '#6c8ebf', surprise: '#b5ead7', neutral: '#c0c0c0',
}
const EMOTION_EMOJI = {
  angry:'😠', disgust:'🤢', fear:'😨', happy:'😄', sad:'😢', surprise:'😮', neutral:'😐',
}
const BLANK_EMOTIONS = { angry:0, disgust:0, fear:0, happy:0, sad:0, surprise:0, neutral:0 }

export default function MockTest({ studentName, onComplete }) {
  const [questions,     setQuestions]     = useState([])
  const [answers,       setAnswers]       = useState({})
  const [currentQ,      setCurrentQ]      = useState(0)
  const [timeLeft,      setTimeLeft]      = useState(TIMER_SECONDS)
  const [emotion,       setEmotion]       = useState('N/A')
  const [faceFound,     setFaceFound]     = useState(false)
  const [emotionCounts, setEmotionCounts] = useState({ ...BLANK_EMOTIONS })
  const [loading,       setLoading]       = useState(true)
  const [submitting,    setSubmitting]    = useState(false)
  const [camError,      setCamError]      = useState(false)

  const videoRef      = useRef(null)
  const canvasRef     = useRef(null)
  const streamRef     = useRef(null)
  const startRef      = useRef(Date.now())
  const emotionRef    = useRef({ ...BLANK_EMOTIONS })   
  const answersRef    = useRef({})                       
  
  const submittingRef = useRef(false)

  
  useEffect(() => { emotionRef.current  = emotionCounts }, [emotionCounts])
  useEffect(() => { answersRef.current  = answers },       [answers])

  
  useEffect(() => {
    fetchQuestions()
      .then(res => { setQuestions(res.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then(stream => {
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => setCamError(true))

    return () => stopCamera()
  }, [])

 
  useEffect(() => {
    if (loading) return
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(id)
          
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [loading])   

  useEffect(() => {
    if (loading || camError) return
    const id = setInterval(async () => {
      const video  = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.readyState < 2) return

      canvas.width  = 320
      canvas.height = 240
      canvas.getContext('2d').drawImage(video, 0, 0, 320, 240)
      const frame = canvas.toDataURL('image/jpeg', 0.8)   

      try {
        const { data } = await analyzeFrame(frame)
        setFaceFound(!!data.face_detected)
        if (data.emotion) {
          setEmotion(data.emotion)
          setEmotionCounts(prev => ({
            ...prev,
            [data.emotion]: (prev[data.emotion] || 0) + 1,
          }))
        }
      } catch { /* network error */ }
    }, 2000)
    return () => clearInterval(id)
  }, [loading, camError])

  const stopCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
  }

  
  const handleAutoSubmit = () => {
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    stopCamera()

    const timeTaken = Math.round((Date.now() - startRef.current) / 1000)
    submitTest({
      student_name:   studentName,
      answers:        Object.fromEntries(
        Object.entries(answersRef.current).map(([k, v]) => [String(k), v])
      ),
      emotion_counts: emotionRef.current,
      time_taken:     timeTaken,
    })
      .then(({ data }) => {
        onComplete({ ...data, emotion_counts: emotionRef.current, time_taken: timeTaken })
      })
      .catch(() => {
        submittingRef.current = false
        setSubmitting(false)
      })
  }

  const doSubmit = useCallback(() => {
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    stopCamera()

    const timeTaken = Math.round((Date.now() - startRef.current) / 1000)
    submitTest({
      student_name:   studentName,
      answers:        Object.fromEntries(
        Object.entries(answersRef.current).map(([k, v]) => [String(k), v])
      ),
      emotion_counts: emotionRef.current,
      time_taken:     timeTaken,
    })
      .then(({ data }) => {
        onComplete({ ...data, emotion_counts: emotionRef.current, time_taken: timeTaken })
      })
      .catch(() => {
        submittingRef.current = false
        setSubmitting(false)
      })
  }, [studentName, onComplete])   

  const selectAnswer = (qid, option) => {
    setAnswers(prev => ({ ...prev, [String(qid)]: option }))
  }

  const formatTime = (s) => {
    const m   = String(Math.floor(s / 60)).padStart(2, '0')
    const sec = String(s % 60).padStart(2, '0')
    return `${m}:${sec}`
  }

  const answeredCount = Object.keys(answers).length
  const progress      = questions.length ? (answeredCount / questions.length) * 100 : 0

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
                  minHeight:'100vh', fontSize:'18px', color:'var(--subtext)' }}>
      ⏳ Loading questions...
    </div>
  )

  const q = questions[currentQ]

  return (
    <div style={S.page}>
   
      <header style={S.header}>
        <span style={S.headerTitle}>🎓 Mock Test  •  {studentName}</span>

        <div style={S.headerCenter}>
          <span style={S.progText}>{answeredCount}/{questions.length} answered</span>
          <div style={S.progBar}>
            <div style={{ ...S.progFill, width: `${progress}%` }} />
          </div>
        </div>

        <div style={{ ...S.timer, color: timeLeft < 60 ? 'var(--red)' : 'var(--green)' }}>
          ⏱ {formatTime(timeLeft)}
        </div>
      </header>


      <div style={S.body}>

       
        <main style={S.main}>
          
          <div style={S.qNav}>
            {questions.map((qq, i) => (
              <button
                key={qq.id}
                onClick={() => setCurrentQ(i)}
                style={{
                  ...S.qNavBtn,
                  background: i === currentQ
                    ? 'var(--green)'
                    : answers[String(qq.id)]
                      ? 'var(--accent)'
                      : 'rgba(255,255,255,0.07)',
                  color:      i === currentQ ? '#000' : 'var(--white)',
                  fontWeight: i === currentQ ? '700' : '500',
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>

          
          {q && (
            <div style={S.qCard} className="fade-in" key={q.id}>
              <div style={S.qMeta}>
                <span style={S.qNum}>Q {currentQ + 1} of {questions.length}</span>
                <span style={{
                  ...S.qSubject,
                  background: q.subject === 'CS' ? 'rgba(0,212,170,0.15)' : 'rgba(255,215,0,0.12)',
                  color:      q.subject === 'CS' ? 'var(--green)'         : 'var(--yellow)',
                }}>
                  {q.subject === 'CS' ? '💻 Computer Science' : '🌍 General Knowledge'}
                </span>
              </div>

              <p style={S.qText}>{q.question}</p>

              <div style={S.options}>
                {q.options.map((opt, idx) => {
                  const selected = answers[String(q.id)] === opt
                  return (
                    <button
                      key={idx}
                      onClick={() => selectAnswer(q.id, opt)}
                      style={{
                        ...S.optBtn,
                        background:  selected ? 'var(--green)'  : 'var(--accent)',
                        color:       selected ? '#000'           : 'var(--white)',
                        borderColor: selected ? 'var(--green)'  : 'transparent',
                        transform:   selected ? 'scale(1.01)'   : 'scale(1)',
                      }}
                    >
                      <span style={S.optLetter}>{['A','B','C','D'][idx]}</span>
                      {opt}
                    </button>
                  )
                })}
              </div>

          
              <div style={S.navRow}>
                <button
                  className="btn btn-accent"
                  onClick={() => setCurrentQ(p => Math.max(0, p - 1))}
                  disabled={currentQ === 0}
                >← Prev</button>

                {currentQ < questions.length - 1 ? (
                  <button
                    className="btn btn-accent"
                    onClick={() => setCurrentQ(p => Math.min(questions.length - 1, p + 1))}
                  >Next →</button>
                ) : (
                  <button
                    className="btn btn-green"
                    onClick={doSubmit}
                    disabled={submitting}
                  >
                    {submitting ? '⏳ Submitting...' : '✅ Submit Test'}
                  </button>
                )}
              </div>
            </div>
          )}
        </main>

       
        <aside style={S.sidebar}>
       
          <div style={S.camCard}>
            <div style={S.camHeader}>
              <span className="pulse" style={{ color:'var(--red)', marginRight:'6px' }}>●</span>
              Live Monitoring
            </div>
            <div style={S.camWrap}>
              {camError ? (
                <div style={S.camError}>📷 Camera unavailable</div>
              ) : (
                <video ref={videoRef} autoPlay muted playsInline style={S.video} />
              )}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div style={{
                ...S.faceTag,
                background: faceFound ? 'rgba(0,212,170,0.85)' : 'rgba(233,69,96,0.85)',
              }}>
                {faceFound ? '✅ Face detected' : '⚠️ No face'}
              </div>
            </div>
          </div>

          
          <div style={S.emoCard}>
            <div style={S.emoTitle}>Current Emotion</div>
            <div style={{ ...S.emoBig, color: EMOTION_COLORS[emotion] || 'var(--white)' }}>
              {EMOTION_EMOJI[emotion] || '😐'}
              <span style={{ marginLeft:'8px' }}>
                {emotion !== 'N/A'
                  ? emotion.charAt(0).toUpperCase() + emotion.slice(1)
                  : 'N/A'}
              </span>
            </div>
          </div>

          <div style={S.chartCard}>
            <div style={S.emoTitle}>Session Emotions</div>
            {Object.entries(emotionCounts).map(([em, cnt]) => {
              const total = Object.values(emotionCounts).reduce((a,b)=>a+b,0)
              const pct   = total > 0 ? Math.round((cnt/total)*100) : 0
              return (
                <div key={em} style={S.barRow}>
                  <span style={S.barLabel}>{EMOTION_EMOJI[em]} {em}</span>
                  <div style={S.barTrack}>
                    <div style={{ ...S.barFill, width:`${pct}%`, background:EMOTION_COLORS[em] }}/>
                  </div>
                  <span style={S.barPct}>{pct}%</span>
                </div>
              )
            })}
          </div>

          
          <button
            className="btn btn-red"
            style={{ width:'100%', fontSize:'14px' }}
            onClick={doSubmit}
            disabled={submitting}
          >
            {submitting ? '⏳ Submitting...' : '⏹ End & Submit'}
          </button>
        </aside>
      </div>
    </div>
  )
}


const S = {
  page: { minHeight:'100vh', display:'flex', flexDirection:'column', background:'var(--bg)' },

  header: {
    display:'flex', alignItems:'center', justifyContent:'space-between',
    background:'var(--accent)', padding:'12px 24px', flexWrap:'wrap', gap:'10px',
  },
  headerTitle:  { fontWeight:'700', fontSize:'15px' },
  headerCenter: { display:'flex', alignItems:'center', gap:'10px', flex:1, justifyContent:'center' },
  progText:     { fontSize:'12px', color:'var(--subtext)', whiteSpace:'nowrap' },
  progBar:      { width:'160px', height:'6px', background:'rgba(255,255,255,0.1)', borderRadius:'3px', overflow:'hidden' },
  progFill:     { height:'100%', background:'var(--green)', borderRadius:'3px', transition:'width 0.3s' },
  timer:        { fontWeight:'800', fontSize:'20px', fontVariantNumeric:'tabular-nums' },

  body: { display:'flex', flex:1, gap:'0', overflow:'hidden' },
  main: { flex:1, padding:'24px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'16px' },

  qNav:    { display:'flex', gap:'8px', flexWrap:'wrap' },
  qNavBtn: { width:'36px', height:'36px', borderRadius:'8px', border:'none', cursor:'pointer', fontSize:'13px', transition:'all 0.2s' },

  qCard:   { background:'var(--panel)', borderRadius:'14px', padding:'28px', display:'flex', flexDirection:'column', gap:'20px' },
  qMeta:   { display:'flex', alignItems:'center', gap:'12px' },
  qNum:    { fontSize:'12px', color:'var(--subtext)', fontWeight:'600' },
  qSubject:{ padding:'4px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'600' },
  qText:   { fontSize:'18px', fontWeight:'600', lineHeight:'1.6', color:'var(--white)' },

  options: { display:'flex', flexDirection:'column', gap:'10px' },
  optBtn:  {
    display:'flex', alignItems:'center', gap:'14px',
    padding:'14px 18px', borderRadius:'10px', border:'2px solid transparent',
    cursor:'pointer', fontSize:'15px', fontFamily:'inherit', textAlign:'left',
    transition:'all 0.18s',
  },
  optLetter: {
    display:'inline-flex', alignItems:'center', justifyContent:'center',
    width:'26px', height:'26px', borderRadius:'50%',
    background:'rgba(255,255,255,0.1)', fontWeight:'700', fontSize:'12px', flexShrink:'0',
  },

  navRow: { display:'flex', justifyContent:'space-between', marginTop:'4px' },

  sidebar: {
    width:'280px', flexShrink:0, background:'var(--panel)',
    borderLeft:'1px solid rgba(255,255,255,0.05)',
    padding:'16px', display:'flex', flexDirection:'column', gap:'12px', overflowY:'auto',
  },
  camCard:   { background:'var(--accent)', borderRadius:'12px', overflow:'hidden' },
  camHeader: { padding:'8px 12px', fontSize:'12px', fontWeight:'600', color:'var(--subtext)' },
  camWrap:   { position:'relative' },
  video:     { width:'100%', display:'block', borderRadius:'0 0 12px 12px' },
  camError:  { height:'160px', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--subtext)', fontSize:'13px' },
  faceTag:   {
    position:'absolute', bottom:'8px', left:'50%', transform:'translateX(-50%)',
    padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'600',
    color:'#000', whiteSpace:'nowrap',
  },

  emoCard:  { background:'var(--accent)', borderRadius:'12px', padding:'14px' },
  emoTitle: { fontSize:'11px', fontWeight:'700', color:'var(--subtext)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'8px' },
  emoBig:   { fontSize:'18px', fontWeight:'700', display:'flex', alignItems:'center' },

  chartCard: { background:'var(--accent)', borderRadius:'12px', padding:'14px', flex:1 },
  barRow:    { display:'flex', alignItems:'center', gap:'6px', marginBottom:'7px' },
  barLabel:  { fontSize:'12px', width:'80px', color:'var(--subtext)', textTransform:'capitalize' },
  barTrack:  { flex:1, height:'6px', background:'rgba(255,255,255,0.08)', borderRadius:'3px', overflow:'hidden' },
  barFill:   { height:'100%', borderRadius:'3px', transition:'width 0.4s' },
  barPct:    { fontSize:'11px', color:'var(--subtext)', width:'28px', textAlign:'right' },
}