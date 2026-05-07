import axios from 'axios'


const BASE = '/api'

export const fetchQuestions = () =>
  axios.get(`${BASE}/questions`)

export const analyzeFrame = (frameBase64) =>
  axios.post(`${BASE}/analyze-frame`, { frame: frameBase64 })

export const submitTest = (payload) =>
  axios.post(`${BASE}/submit-test`, payload)