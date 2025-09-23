// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://leitqpclvmoawcollrfe.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlaXRxcGNsdm1vYXdjb2xscmZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MTA0MDEsImV4cCI6MjA3MzQ4NjQwMX0.NOLumuW74V_iWbV1iuf8cJPQtF0PwY803H9WSDe0Uik'; // Use anon/public key

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
