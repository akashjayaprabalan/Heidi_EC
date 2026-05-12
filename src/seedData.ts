export type SeedReportRow = {
  reportNumber: number;
  date: string;
  clinic: string;
  patient: string;
  reportType: string;
  reportBody: string;
  summary: string;
};

export const SEED_REPORT_ROWS: SeedReportRow[] = [
  {
    "reportNumber": 1,
    "date": "2026-01-06",
    "clinic": "Harbour Physio (Me)",
    "patient": "Sam Lee",
    "reportType": "Initial Physiotherapy Assessment",
    "reportBody": "Presenting complaint: Acute low back pain (left-sided) after lifting a heavy box 3 days ago.\nSubjective: Pain rated 6/10, worse with bending forward, prolonged sitting, and getting up from a chair. No numbness/tingling reported. Sleep mildly disturbed.\nObjective: Reduced lumbar flexion (~40% limited), tenderness over left lumbar paraspinals/QL, mild protective spasm. Extension tolerated better than flexion. Neurological screen (lower limb) grossly normal.\nAssessment: Mechanical low back pain with muscular guarding; no current red flag findings noted.\nTreatment provided: Soft tissue release (lumbar paraspinals), gentle mobility work, pain-free repeated extension in lying, education on posture and activity pacing.\nPlan: 1-2 sessions/week for 2 weeks. Home exercises: pelvic tilts, walking program, extension-based mobility drills.",
    "summary": "Mechanical low back pain likely related to lifting strain. Main deficits are lumbar flexion restriction and muscle spasm. Began pain management, mobility work, and home exercise program."
  },
  {
    "reportNumber": 2,
    "date": "2026-01-20",
    "clinic": "City Sports Rehab",
    "patient": "Sam Lee",
    "reportType": "Transfer / Follow-up Assessment",
    "reportBody": "Presenting complaint: Ongoing low back pain, improved since initial flare. Previous physiotherapy report reviewed (Harbour Physio (Me), 2026-01-06).\nSubjective: Pain now 3/10 at rest and up to 5/10 after long sitting. Reports improvement in walking tolerance. Still stiff in mornings. No radiating symptoms.\nObjective: Lumbar flexion improved (now ~20% limited), residual left paraspinal tightness, reduced trunk endurance, mild pain with sit-to-stand repetition. Neurological signs remain unremarkable.\nAssessment: Improving mechanical low back pain with residual stiffness and reduced core endurance.\nTreatment provided: Manual therapy to lumbar and thoracolumbar region, trunk stabilisation exercises (dead bug progression, bridge holds), hip mobility drills, ergonomic education for desk setup.\nPlan: Progress strengthening and return to gym with modified loads over next 2-3 weeks.",
    "summary": "Back pain has improved since initial episode, with better flexion and walking tolerance. Focus shifted from pain relief to trunk endurance, hip mobility, and graded return to lifting."
  },
  {
    "reportNumber": 3,
    "date": "2026-01-07",
    "clinic": "Harbour Physio (Me)",
    "patient": "Maya Patel",
    "reportType": "Initial Physiotherapy Assessment",
    "reportBody": "Presenting complaint: Right ankle pain/swelling after inversion injury during social soccer 5 days ago.\nSubjective: Pain 5/10 with walking, 7/10 when descending stairs. Mild bruising noticed by patient. Has been using rest and ice intermittently.\nObjective: Mild lateral ankle swelling, tenderness over ATFL region, pain with inversion and plantarflexion end range, antalgic gait. Single-leg balance on right reduced. Ottawa ankle rule screening negative for immediate fracture concerns based on presentation.\nAssessment: Likely grade I-II lateral ankle sprain (right).\nTreatment provided: Compression advice, swelling management education, pain-free ROM drills, taping for support, early weight-bearing guidance, calf pump exercises.\nPlan: Review in 1-2 weeks; progress balance and strengthening once swelling decreases.",
    "summary": "Right lateral ankle sprain with swelling, pain, and reduced balance. Early rehab started with taping, ROM, and swelling control strategies."
  },
  {
    "reportNumber": 4,
    "date": "2026-01-24",
    "clinic": "Northside Physio",
    "patient": "Maya Patel",
    "reportType": "Transfer / Follow-up Assessment",
    "reportBody": "Presenting complaint: Right ankle recovery check following prior treatment at Harbour Physio (Me).\nSubjective: Pain reduced to 2-3/10 during walking; occasional discomfort with quick direction changes. Swelling largely resolved. Wants to return to soccer training.\nObjective: Improved gait pattern, mild tenderness remains over lateral ankle ligaments, dorsiflexion still slightly reduced compared to left. Single-leg balance improved but dynamic control poor during hop preparation.\nAssessment: Recovering lateral ankle sprain with remaining proprioceptive and dynamic stability deficits.\nTreatment provided: Joint mobility (ankle dorsiflexion emphasis), theraband strengthening (eversion/inversion), balance board training, step-down control drills, return-to-run criteria discussion.\nPlan: Progress to hopping/change-of-direction drills if pain/swelling remain stable. Continue brace/tape for sport re-entry.",
    "summary": "Ankle symptoms improved significantly, but dynamic balance and control remain limited for sport. Rehab progressed toward strength, proprioception, and return-to-soccer readiness."
  },
  {
    "reportNumber": 5,
    "date": "2026-01-08",
    "clinic": "Harbour Physio (Me)",
    "patient": "Jordan Kim",
    "reportType": "Initial Physiotherapy Assessment",
    "reportBody": "Presenting complaint: Neck pain and tension headaches after prolonged laptop work over several weeks.\nSubjective: Pain 4/10 at baseline, increasing to 6/10 by evening. Reports stiffness, headaches at base of skull, and relief with movement/breaks. No upper limb numbness or weakness reported.\nObjective: Forward head posture, reduced cervical rotation (left > right), tenderness in upper trapezius/levator scapulae/suboccipitals, reduced thoracic extension mobility. Upper limb neurological screen grossly normal.\nAssessment: Mechanical neck pain with postural overload and cervicogenic headache features.\nTreatment provided: Soft tissue therapy to upper trapezius/suboccipitals, thoracic mobilisation, postural education, cervical ROM drills, scapular setting exercises.\nPlan: Ergonomic modifications + micro-break schedule. Review in 2 weeks.",
    "summary": "Posture-related neck pain with tension/cervicogenic headache pattern. Treatment focused on soft tissue relief, thoracic mobility, and workstation/posture correction."
  },
  {
    "reportNumber": 6,
    "date": "2026-01-28",
    "clinic": "Peak Performance",
    "patient": "Jordan Kim",
    "reportType": "Transfer / Follow-up Assessment",
    "reportBody": "Presenting complaint: Persistent neck stiffness with reduced headache frequency after prior physio care. Previous report from Harbour Physio (Me) reviewed.\nSubjective: Headaches now 1-2 times/week (previously near-daily). Neck pain 2-4/10. Symptoms flare with long coding sessions.\nObjective: Cervical rotation improved bilaterally, mild residual restriction in upper cervical extension/rotation, endurance deficits in deep neck flexors and scapular stabilisers. Thoracic extension still mildly limited.\nAssessment: Improving mechanical/postural neck pain with residual endurance deficits contributing to flare-ups.\nTreatment provided: Deep neck flexor retraining, scapular endurance exercises (rows, wall slides), thoracic extension mobility, ergonomic review for monitor height and keyboard position.\nPlan: Continue progressive strengthening/endurance work; review in 2 weeks if headaches persist.",
    "summary": "Headache frequency and neck pain have improved, but postural endurance remains a key issue. Rehab progressed toward neck/scapular endurance and flare prevention during desk work."
  },
  {
    "reportNumber": 7,
    "date": "2026-01-09",
    "clinic": "Harbour Physio (Me)",
    "patient": "Ava Chen",
    "reportType": "Initial Physiotherapy Assessment",
    "reportBody": "Presenting complaint: Right shoulder pain during overhead activity and gym pressing movements for ~1 month.\nSubjective: Pain 3/10 at rest, 6/10 with overhead press and reaching behind back. No major trauma. Reports stiffness after workouts.\nObjective: Painful arc (approx. 70-120 degrees abduction), mild weakness in external rotation/abduction, tenderness around supraspinatus tendon insertion, reduced thoracic extension and scapular upward rotation control.\nAssessment: Shoulder pain consistent with rotator cuff tendinopathy / subacromial pain presentation.\nTreatment provided: Load modification advice, isometric external rotation, scapular control drills, thoracic mobility work, soft tissue treatment to posterior shoulder.\nPlan: Avoid painful overhead loading temporarily; graded strengthening program over 4-6 weeks.",
    "summary": "Right shoulder pain consistent with rotator cuff overload/tendinopathy. Initial treatment focused on load management, pain reduction, and scapular/rotator cuff strengthening."
  },
  {
    "reportNumber": 8,
    "date": "2026-01-30",
    "clinic": "Bayside Movement",
    "patient": "Ava Chen",
    "reportType": "Transfer / Follow-up Assessment",
    "reportBody": "Presenting complaint: Ongoing right shoulder rehab after initial management at Harbour Physio (Me).\nSubjective: Pain reduced to 2/10 in daily activities; still 4-5/10 with overhead lifting at gym. Reports better sleep and less post-workout ache.\nObjective: Painful arc now less pronounced, shoulder ROM near full, persistent weakness/endurance deficit in rotator cuff and lower trapezius. Technique faults noted with overhead movement pattern.\nAssessment: Improving shoulder pain; symptoms now primarily load- and control-related.\nTreatment provided: Progressive rotator cuff strengthening (band/cable), serratus + lower trap drills, overhead movement retraining, gym exercise regression guidance.\nPlan: Gradual return to pressing volume; monitor symptom response within 24-hour rule.",
    "summary": "Shoulder symptoms improved in daily life, but overhead gym loading still aggravates pain. Rehab progressed to strength/endurance and movement-pattern correction for return to training."
  },
  {
    "reportNumber": 9,
    "date": "2026-01-13",
    "clinic": "City Sports Rehab",
    "patient": "Noah Singh",
    "reportType": "Initial Physiotherapy Assessment",
    "reportBody": "Presenting complaint: Anterior knee pain (left) with stairs, squats, and running over past 6 weeks.\nSubjective: Pain 2/10 at rest, up to 6/10 with stairs/squats. No locking/giving way. Training volume recently increased.\nObjective: Pain reproduced with single-leg squat (left), dynamic valgus control reduced, quadriceps and glute med weakness noted, patellar compression mildly provocative. Full knee ROM.\nAssessment: Patellofemoral pain presentation, likely related to training load and lower limb control deficits.\nTreatment provided: Activity modification (reduce running volume temporarily), taping trial, quad/glute strengthening program, step-down control drills, education on load monitoring.\nPlan: Reassess in 2-3 weeks and progress running if pain settles.",
    "summary": "Left patellofemoral-type knee pain linked to increased training load and movement control deficits. Started strengthening, load management, and functional control exercises."
  },
  {
    "reportNumber": 10,
    "date": "2026-02-03",
    "clinic": "Northside Physio",
    "patient": "Noah Singh",
    "reportType": "Transfer / Follow-up Assessment",
    "reportBody": "Presenting complaint: Follow-up for left anterior knee pain after prior treatment at City Sports Rehab.\nSubjective: Pain now 1-3/10 with stairs; running tolerance improved but discomfort returns after longer distances. Taping helped initially.\nObjective: Improved single-leg squat control, reduced pain on step-down test, ongoing hip abductor endurance deficit and cadence issues during treadmill observation.\nAssessment: Improving patellofemoral pain; residual load tolerance and kinetic control deficits remain.\nTreatment provided: Running retraining cues (cadence and step length), progression of split squat and step-up loading, hip endurance circuit, patellar unloading education.\nPlan: Gradual run progression over 2-4 weeks if symptoms stay <=3/10 during and after activity.",
    "summary": "Knee pain is improving, with better stair tolerance and squat control. Current focus is running mechanics, hip endurance, and graded return to full running volume."
  },
  {
    "reportNumber": 11,
    "date": "2026-01-14",
    "clinic": "City Sports Rehab",
    "patient": "Priya Rao",
    "reportType": "Initial Physiotherapy Assessment",
    "reportBody": "Presenting complaint: Right lateral elbow pain aggravated by gripping and typing, ongoing for 1 month.\nSubjective: Pain 4/10 with computer work, 6/10 when lifting kettle/pan. No neck-related symptoms reported.\nObjective: Tenderness over lateral epicondyle/common extensor tendon, pain with resisted wrist extension and gripping, mild forearm extensor tightness. Cervical screening non-contributory.\nAssessment: Lateral elbow tendinopathy (tennis elbow presentation).\nTreatment provided: Education on tendon load management, isometric wrist extensor loading, forearm soft tissue release, ergonomic advice for mouse/keyboard, grip modification strategies.\nPlan: Daily isometric program, then gradual eccentric/concentric progression.",
    "summary": "Right lateral elbow pain consistent with tendinopathy from repetitive gripping/typing load. Initial management focused on load reduction, isometrics, and workstation adjustments."
  },
  {
    "reportNumber": 12,
    "date": "2026-02-04",
    "clinic": "Peak Performance",
    "patient": "Priya Rao",
    "reportType": "Transfer / Follow-up Assessment",
    "reportBody": "Presenting complaint: Ongoing right elbow rehab after prior care at City Sports Rehab.\nSubjective: Pain reduced to 2-4/10; still aggravated by prolonged mouse use and carrying shopping bags. Improved tolerance to daily tasks overall.\nObjective: Less tenderness at lateral elbow, grip strength improved but still slightly limited vs left, pain persists with higher-load wrist extension. Forearm muscle endurance reduced.\nAssessment: Improving lateral elbow tendinopathy with remaining load tolerance deficit.\nTreatment provided: Progressed tendon loading (eccentric-concentric wrist extensor exercises), proximal shoulder/scapula strengthening, ergonomic reinforcement, self-management flare strategy.\nPlan: Continue progressive loading 3-4x/week; monitor symptom irritability and avoid sudden load spikes.",
    "summary": "Elbow pain has improved but remains sensitive to sustained computer use and carrying loads. Rehab progressed to heavier tendon loading and shoulder support strength."
  },
  {
    "reportNumber": 13,
    "date": "2026-01-16",
    "clinic": "City Sports Rehab",
    "patient": "Ethan Park",
    "reportType": "Initial Physiotherapy Assessment",
    "reportBody": "Presenting complaint: Left heel pain (plantar aspect) on first steps in morning and after standing at work.\nSubjective: Pain 5/10 on first steps, easing after movement, returns by end of day. Symptoms present ~2 months.\nObjective: Tenderness at plantar fascia insertion (medial calcaneal region), reduced ankle dorsiflexion, calf tightness, discomfort with single-leg heel raise and prolonged standing.\nAssessment: Plantar heel pain / plantar fasciopathy presentation.\nTreatment provided: Education on load management and footwear support, plantar fascia and calf stretching, calf strengthening, taping trial, ice/rolling advice for symptom relief.\nPlan: Progress calf loading and foot intrinsic strengthening; review in 2-3 weeks.",
    "summary": "Left plantar heel pain consistent with plantar fasciopathy. Treatment initiated with footwear/load advice, stretching, taping, and calf/foot strengthening."
  },
  {
    "reportNumber": 14,
    "date": "2026-02-06",
    "clinic": "Bayside Movement",
    "patient": "Ethan Park",
    "reportType": "Transfer / Follow-up Assessment",
    "reportBody": "Presenting complaint: Persistent but improving left heel pain following prior care at City Sports Rehab.\nSubjective: Morning pain reduced to 3/10; still painful after long shifts standing. Reports partial benefit from taping and supportive shoes.\nObjective: Tenderness still present but reduced, dorsiflexion mildly improved, calf strength/endurance remains below target on left. Gait improved with footwear support.\nAssessment: Improving plantar fasciopathy with ongoing tissue load intolerance in prolonged standing contexts.\nTreatment provided: Progressive calf raises (straight/bent knee), plantar loading progression, foot intrinsic control drills, standing-break strategy, workday symptom pacing advice.\nPlan: Continue strengthening and footwear modifications; reassess work tolerance after 2 weeks.",
    "summary": "Heel pain is improving, especially in the morning, but prolonged standing still provokes symptoms. Current focus is progressive calf/foot loading and workday pacing strategies."
  },
  {
    "reportNumber": 15,
    "date": "2026-01-21",
    "clinic": "Northside Physio",
    "patient": "Sofia Gomez",
    "reportType": "Initial Physiotherapy Assessment",
    "reportBody": "Presenting complaint: Right hamstring strain (mid-belly) during sprinting at training 10 days ago.\nSubjective: Pain now 2/10 walking, 6/10 when attempting faster running. No bruising currently visible. Wants return to sport soon.\nObjective: Tenderness in posterior thigh (mid hamstring), pain with resisted knee flexion at higher effort, reduced hamstring flexibility and confidence with stride length. Jogging tolerated; sprinting not tested.\nAssessment: Resolving mild-to-moderate hamstring strain with current strength and load tolerance deficits.\nTreatment provided: Early-stage strengthening (isometrics/isotonics), glute activation, trunk control drills, graded return-to-run framework explained.\nPlan: Progress to higher-speed running only when strength and pain criteria met.",
    "summary": "Right hamstring strain is in recovery phase but not ready for sprinting. Rehab began with strengthening and a graded return-to-running pathway."
  },
  {
    "reportNumber": 16,
    "date": "2026-02-10",
    "clinic": "Peak Performance",
    "patient": "Sofia Gomez",
    "reportType": "Transfer / Follow-up Assessment",
    "reportBody": "Presenting complaint: Hamstring rehab progression after prior treatment at Northside Physio.\nSubjective: Walking and light jogging pain-free. Mild tightness only after drills. No pain at daily activity level.\nObjective: Improved hamstring strength and flexibility, no tenderness on palpation, tolerated progressive tempo runs at submax speed. Residual asymmetry in eccentric hamstring control noted.\nAssessment: Good recovery progression; nearing return to sport, with eccentric strength and high-speed exposure still required.\nTreatment provided: Eccentric hamstring loading (RDL variation/Nordic prep), sprint mechanics drills, glute and trunk stability progression, return-to-sprint criteria education.\nPlan: Gradual exposure to higher-speed running over 1-2 weeks if symptom-free.",
    "summary": "Hamstring recovery is progressing well, with pain-free jogging and improved strength. Final rehab phase now focuses on eccentric control and safe return to sprinting."
  },
  {
    "reportNumber": 17,
    "date": "2026-01-22",
    "clinic": "Northside Physio",
    "patient": "Liam Walker",
    "reportType": "Initial Physiotherapy Assessment",
    "reportBody": "Presenting complaint: Left lateral hip pain during long walks and side-lying sleep, ongoing ~5 weeks.\nSubjective: Pain 3/10 walking, 5/10 when lying on left side at night. No groin pain. Increased symptoms after starting incline walking.\nObjective: Tenderness over greater trochanter/gluteal tendon region, pain with single-leg stance and resisted hip abduction, mild hip abductor weakness and pelvic drop on functional testing.\nAssessment: Lateral hip pain consistent with gluteal tendinopathy / greater trochanteric pain presentation.\nTreatment provided: Education on compression avoidance (sleep positioning), activity modification, hip abductor strengthening, gait/load advice, soft tissue work to surrounding musculature (non-compressive).\nPlan: Progressive hip strengthening and symptom-guided walking progression.",
    "summary": "Left lateral hip pain is consistent with gluteal tendon overload. Treatment focused on reducing tendon compression, improving hip strength, and modifying walking load."
  },
  {
    "reportNumber": 18,
    "date": "2026-02-12",
    "clinic": "Bayside Movement",
    "patient": "Liam Walker",
    "reportType": "Transfer / Follow-up Assessment",
    "reportBody": "Presenting complaint: Follow-up for left lateral hip pain after initial rehab at Northside Physio.\nSubjective: Night pain improved with pillow support; walking tolerance better on flat ground. Inclines still provoke discomfort (up to 4/10).\nObjective: Reduced tenderness at lateral hip, improved single-leg stance control, persistent hip abductor endurance deficit and trunk compensation under fatigue.\nAssessment: Improving gluteal tendinopathy with residual endurance and load-management limitations.\nTreatment provided: Progressed abductor strengthening (standing band work, step holds), lateral chain endurance circuit, incline walking pacing strategy, sleep positioning review.\nPlan: Gradually reintroduce inclines; continue strength progression 3x/week.",
    "summary": "Hip symptoms have improved, especially night pain and flat-ground walking. Remaining issue is hip endurance under load, especially during incline walking."
  },
  {
    "reportNumber": 19,
    "date": "2026-01-23",
    "clinic": "Peak Performance",
    "patient": "Zara Ali",
    "reportType": "Initial Physiotherapy Assessment",
    "reportBody": "Presenting complaint: Mid-thoracic stiffness and upper back pain related to prolonged desk work and study.\nSubjective: Ache/stiffness 3/10 most days, 5/10 after long sitting. Feels \"tight between shoulder blades.\" Improves with stretching and movement.\nObjective: Reduced thoracic extension/rotation, stiffness in thoracic paraspinals, rounded shoulder posture, reduced scapular endurance. No neurological symptoms reported.\nAssessment: Mechanical thoracic spine pain with postural deconditioning/endurance deficits.\nTreatment provided: Thoracic mobility exercises, manual therapy to thoracic segments/paraspinals, scapular endurance work, posture and break-frequency education.\nPlan: Home program daily mobility + strengthening 3x/week; ergonomic review.",
    "summary": "Upper back pain is consistent with posture-related thoracic stiffness from prolonged sitting. Treatment began with thoracic mobility, manual therapy, and scapular endurance exercises."
  },
  {
    "reportNumber": 20,
    "date": "2026-02-13",
    "clinic": "Bayside Movement",
    "patient": "Zara Ali",
    "reportType": "Transfer / Follow-up Assessment",
    "reportBody": "Presenting complaint: Persistent upper back stiffness with partial improvement after prior care at Peak Performance.\nSubjective: Pain now usually 1-3/10, flares during exam/study periods with long sitting. Reports mobility drills help temporarily.\nObjective: Thoracic mobility improved (especially rotation), scapular control better in low-load tasks, endurance still reduced during prolonged seated posture. No red flag symptoms reported.\nAssessment: Improving mechanical thoracic pain with remaining postural endurance deficits.\nTreatment provided: Progressed thoracic extension strength/mobility, scapular endurance circuit, desk setup refinement, timed movement break strategy, breathing/posture reset drills.\nPlan: Continue progressive endurance and self-management during high study load weeks.",
    "summary": "Upper back symptoms have improved, but prolonged study still triggers flare-ups. Ongoing rehab targets postural endurance and practical self-management during desk-heavy periods."
  }
];
