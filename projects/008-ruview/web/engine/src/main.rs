//! Research adapter: synthetic frames -> unmodified RuView vital-sign extractors.
//! The input generator and presentation are ours; all vital estimates are upstream.
use std::{f64::consts::PI, time::Instant};
use wifi_densepose_vitals::{BreathingExtractor, HeartRateExtractor, CsiVitalPreprocessor, CsiFrame, VitalEstimate};
use serde_json::{json, Value};

fn estimate(e: Option<VitalEstimate>) -> Value {
    match e { Some(e) => json!({"bpm":e.value_bpm,"confidence":e.confidence,"status":format!("{:?}",e.status)}), None=>Value::Null }
}
fn main() {
    let a: Vec<String> = std::env::args().collect();
    let val = |i: usize, default:f64| a.get(i).and_then(|s|s.parse::<f64>().ok()).filter(|v|v.is_finite()).unwrap_or(default);
    let br=val(1,15.0).clamp(6.,30.); let hr=val(2,72.).clamp(48.,120.);
    let noise=val(3,0.03).clamp(0.,2.); let motion=val(4,0.).clamp(0.,3.);
    let channels=val(5,56.).clamp(1.,56.) as usize;
    let occupied=val(6,1.)>0.;
    let fs=50.0; let seconds=45.; let started=Instant::now();
    let mut pre=CsiVitalPreprocessor::new(channels,0.02);
    let mut breathing=BreathingExtractor::new(channels,fs,30.);
    let mut heart=HeartRateExtractor::new(channels,fs,15.);
    let mut seed=42u64;
    let mut rand=|| { seed=seed.wrapping_mul(6364136223846793005).wrapping_add(1); ((seed>>33) as f64/((1u64<<31) as f64))*2.-1. };
    let mut rows=Vec::new(); let mut last_br=Value::Null; let mut last_hr=Value::Null;
    let mut heat=Vec::new();
    for i in 0..(seconds*fs) as usize {
        let t=i as f64/fs;
        let respiration=if occupied {(2.*PI*br/60.*t).sin()}else{0.};
        let cardiac=if occupied {0.15*(2.*PI*hr/60.*t).sin()}else{0.};
        let interference=motion*((2.*PI*0.7*t).sin()+0.4*(2.*PI*1.7*t).sin());
        let amplitudes:Vec<f64>=(0..channels).map(|k| 10.+ (1.+k as f64*0.003)*(respiration+cardiac+interference)+noise*rand()).collect();
        let phases:Vec<f64>=(0..channels).map(|k|k as f64*0.01+cardiac*0.01).collect();
        let frame=CsiFrame {amplitudes,phases,n_subcarriers:channels,sample_index:i as u64,sample_rate_hz:fs};
        if let Some(residuals)=pre.process(&frame) {
            last_br=estimate(breathing.extract(&residuals,&[]));
            last_hr=estimate(heart.extract(&residuals,&frame.phases));
            if i%10==0 || i==(seconds*fs) as usize-1 {
                rows.push(json!({"t":t,"input":frame.amplitudes[0]-10.,"residual":residuals[0],"breathing":last_br,"heart":last_hr}));
                heat.push(residuals.iter().step_by((channels/14).max(1)).take(14).copied().collect::<Vec<_>>());
            }
        }
    }
    println!("{}",json!({"schema":1,"evidence":"synthetic-input-real-upstream-algorithm","commit":"33a9e90896a691a3f98de042b463e5945178b87c","crate":"wifi-densepose-vitals 0.3.2","input":{"breathing":br,"heart":hr,"noise":noise,"motion":motion,"channels":channels,"occupied":occupied,"sample_rate":fs,"duration":seconds,"seed":42},"result":{"breathing":last_br,"heart":last_hr},"elapsed_ms":started.elapsed().as_secs_f64()*1000.,"series":rows,"heatmap":heat}));
}
