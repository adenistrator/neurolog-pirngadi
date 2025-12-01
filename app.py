import streamlit as st
import pandas as pd
from datetime import datetime

# --- KONFIGURASI HALAMAN ---
st.set_page_config(page_title="NeuroLog Pirngadi", page_icon="🧠")

# --- JUDUL & HEADER ---
st.title("🧠 NeuroLog: Data Klinis")
st.markdown("RSUD Dr. Pirngadi Medan | Input Data Vital & Skor")

# --- BAGIAN 1: IDENTITAS PASIEN ---
st.header("1. Identitas Pasien")
col1, col2 = st.columns(2)
with col1:
    nama_koas = st.text_input("Nama Dokter Muda (Koas)")
    no_rm = st.text_input("No. RM (3 Digit Terakhir + Inisial)", help="Contoh: 123-TN")
with col2:
    usia = st.number_input("Usia Pasien", min_value=0, max_value=120)
    diagnosis = st.text_input("Diagnosis Kerja")

# --- BAGIAN 2: VITAL SIGN ---
st.header("2. Tanda Vital")
c1, c2, c3 = st.columns(3)
with c1:
    td_sys = st.number_input("TD Sistol", value=120)
    td_dia = st.number_input("TD Diastol", value=80)
with c2:
    hr = st.number_input("Nadi (x/i)", value=80)
    rr = st.number_input("RR (x/i)", value=20)
with c3:
    temp = st.number_input("Suhu (°C)", value=36.5)
    spo2 = st.number_input("SpO2 (%)", value=98)

# --- BAGIAN 3: NYERI & ONKOLOGI ---
st.header("3. Pain & Performance")
st.info("Geser slider untuk menilai skala nyeri")
nrs_diam = st.slider("NRS Diam (0-10)", 0, 10, 0)
nrs_gerak = st.slider("NRS Gerak (0-10)", 0, 10, 0)

karnofsky = st.selectbox("Karnofsky Performance Score (Khusus Tumor)", [
    (100, "100 - Normal, tidak ada keluhan"),
    (90, "90 - Mampu aktivitas normal, gejala ringan"),
    (80, "80 - Aktivitas normal dengan upaya, ada gejala"),
    (70, "70 - Mandiri, tapi tidak bisa kerja berat"),
    (60, "60 - Butuh bantuan sesekali"),
    (50, "50 - Butuh bantuan dan perawatan medis sering"),
    (40, "40 - Disable, butuh bantuan khusus"),
    (30, "30 - Parah, butuh rawat inap"),
    (20, "20 - Sangat sakit, perlu support aktif"),
    (10, "10 - Sekarat"),
    (0, "0 - Meninggal")
])

# --- BAGIAN 4: NIHSS CALCULATOR (OTOMATIS) ---
st.header("4. Stroke - NIHSS Calculator")

def nihss_input(label, options):
    return st.selectbox(label, options, format_func=lambda x: f"{x[0]} - {x[1]}")

nihss_1a = nihss_input("1a. Tingkat Kesadaran", [(0, "Sadar Penuh"), (1, "Somnolen"), (2, "Stupor/Koma"), (3, "Koma Dalam")])
nihss_1b = nihss_input("1b. Menjawab Pertanyaan", [(0, "Benar Semua"), (1, "Benar Satu"), (2, "Salah Semua")])
nihss_1c = nihss_input("1c. Mengikuti Perintah", [(0, "Benar Semua"), (1, "Benar Satu"), (2, "Salah Semua")])
nihss_2 = nihss_input("2. Gerakan Mata", [(0, "Normal"), (1, "Parsial Gaze Palsy"), (2, "Forced Deviation")])
nihss_3 = nihss_input("3. Visual", [(0, "Normal"), (1, "Hemianopia Parsial"), (2, "Hemianopia Komplit"), (3, "Bilateral Hemianopia")])
nihss_4 = nihss_input("4. Wajah", [(0, "Normal"), (1, "Minor/Nasolabial"), (2, "Parsial"), (3, "Komplit")])
nihss_5a = nihss_input("5a. Lengan Kiri", [(0, "Tidak turun"), (1, "Turun <10dtk"), (2, "Jatuh <10dtk"), (3, "Tidak bisa melawan gravitasi"), (4, "Tidak ada gerak")])
nihss_5b = nihss_input("5b. Lengan Kanan", [(0, "Tidak turun"), (1, "Turun <10dtk"), (2, "Jatuh <10dtk"), (3, "Tidak bisa melawan gravitasi"), (4, "Tidak ada gerak")])
nihss_6a = nihss_input("6a. Tungkai Kiri", [(0, "Tidak turun"), (1, "Turun <5dtk"), (2, "Jatuh <5dtk"), (3, "Tidak bisa melawan gravitasi"), (4, "Tidak ada gerak")])
nihss_6b = nihss_input("6b. Tungkai Kanan", [(0, "Tidak turun"), (1, "Turun <5dtk"), (2, "Jatuh <5dtk"), (3, "Tidak bisa melawan gravitasi"), (4, "Tidak ada gerak")])
nihss_7 = nihss_input("7. Ataksia", [(0, "Tidak ada"), (1, "Satu anggota"), (2, "Dua anggota/lebih")])
nihss_8 = nihss_input("8. Sensorik", [(0, "Normal"), (1, "Kurang rasa ringan"), (2, "Kurang rasa berat/total")])
nihss_9 = nihss_input("9. Bahasa", [(0, "Normal"), (1, "Afasia Ringan-Sedang"), (2, "Afasia Berat"), (3, "Mute/Global")])
nihss_10 = nihss_input("10. Disartria", [(0, "Normal"), (1, "Ringan-Sedang"), (2, "Berat/Anartria")])
nihss_11 = nihss_input("11. Pengabaian", [(0, "Tidak ada"), (1, "Parsial"), (2, "Komplit")])

total_nihss = (nihss_1a[0] + nihss_1b[0] + nihss_1c[0] + nihss_2[0] + nihss_3[0] + nihss_4[0] +
               nihss_5a[0] + nihss_5b[0] + nihss_6a[0] + nihss_6b[0] + nihss_7[0] + nihss_8[0] +
               nihss_9[0] + nihss_10[0] + nihss_11[0])

st.markdown("---")
st.subheader(f"🔢 TOTAL SCORE NIHSS: {total_nihss}")

# --- TABEL SEMENTARA ---
if 'data_pasien' not in st.session_state:
    st.session_state.data_pasien = []

if st.button("💾 SIMPAN DATA SEMENTARA"):
    new_data = {
        "Waktu": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "Koas": nama_koas,
        "RM": no_rm,
        "Usia": usia,
        "NIHSS": total_nihss,
        "NRS Diam": nrs_diam,
        "Karnofsky": karnofsky[0]
    }
    st.session_state.data_pasien.append(new_data)
    st.success("Data tersimpan di sesi ini! (Akan hilang jika di-refresh, segera download)")

if st.session_state.data_pasien:
    df = pd.DataFrame(st.session_state.data_pasien)
    st.write("Preview Data:", df)
    
    csv = df.to_csv(index=False).encode('utf-8')
    st.download_button(
        "📥 Download CSV (Excel)",
        csv,
        "data_klinis_harian.csv",
        "text/csv"
    )
