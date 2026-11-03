import streamlit as st
import pandas as pd
from datetime import datetime
from fpdf import FPDF
import base64

# --- KONFIGURASI HALAMAN ---
st.set_page_config(page_title="NeuroLog Pirngadi", page_icon="🧠", layout="centered")

# --- CSS CUSTOM BIAR RAPI ---
st.markdown("""
    <style>
    .big-font { font-size:20px !important; font-weight: bold; }
    .stTabs [data-baseweb="tab-list"] { gap: 10px; }
    .stTabs [data-baseweb="tab"] { height: 50px; white-space: pre-wrap; background-color: #f0f2f6; border-radius: 5px 5px 0 0; }
    .stTabs [aria-selected="true"] { background-color: #ff4b4b; color: white; }
    </style>
    """, unsafe_allow_html=True)

st.title("🧠 NeuroLog Pirngadi")
st.caption("Aplikasi Logbook Klinis & Kalkulator Skor Terintegrasi")

# --- INISIALISASI SESSION STATE (Simpan Data Antar Tab) ---
if 'pasien' not in st.session_state:
    st.session_state.pasien = {}

# --- FUNGSI PEMBUAT PDF ---
# Font bawaan PDF (Helvetica) hanya mendukung karakter Latin-1.
# Karakter lain (tanda pisah panjang, kutip miring, emoji, dll.) diganti dulu
# supaya PDF tidak crash saat koas menyalin teks dari dokumen lain.
_PENGGANTI = {
    "\u2013": "-", "\u2014": "-", "\u2212": "-",
    "\u2018": "'", "\u2019": "'", "\u201c": '"', "\u201d": '"',
    "\u2026": "...", "\u2022": "-", "\u2264": "<=", "\u2265": ">=",
}

def bersihkan(teks):
    teks = str(teks)
    for asal, ganti in _PENGGANTI.items():
        teks = teks.replace(asal, ganti)
    return teks.encode("latin-1", errors="replace").decode("latin-1")

def create_pdf(data):
    pdf = FPDF()
    pdf.add_page()

    def baris(teks, h=8, style="", size=11, align="L", fill=False):
        pdf.set_font("Helvetica", style, size)
        pdf.multi_cell(0, h, bersihkan(teks), align=align, fill=fill,
                       new_x="LMARGIN", new_y="NEXT")

    baris("RESUME KLINIS NEUROLOGI", h=10, style="B", size=16, align="C")
    baris(f"RSUD Dr. Pirngadi Medan | Tanggal: {datetime.now().strftime('%d-%m-%Y')}",
          h=10, style="I", size=10, align="C")
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(5)

    # Identitas
    baris("1. IDENTITAS PASIEN", h=10, style="B", size=12)
    baris(f"Nama Koas: {data.get('koas') or '-'}")
    baris(f"No. RM: {data.get('rm') or '-'}")
    baris(f"Usia: {data.get('usia', '-')} Tahun")
    baris(f"Diagnosis: {data.get('diagnosis') or '-'}")
    pdf.ln(5)

    # Vital Sign
    baris("2. TANDA VITAL", h=10, style="B", size=12)
    pdf.set_font("Helvetica", "", 11)
    col_width = 45
    vital = [f"TD: {data.get('td', '-')}", f"HR: {data.get('hr', '-')} x/i",
             f"RR: {data.get('rr', '-')} x/i", f"Suhu: {data.get('temp', '-')} C"]
    for i, teks in enumerate(vital):
        akhir = i == len(vital) - 1
        pdf.cell(col_width, 8, bersihkan(teks), border=1,
                 new_x="LMARGIN" if akhir else "RIGHT",
                 new_y="NEXT" if akhir else "TOP")
    pdf.ln(5)

    # Skor Klinis
    baris("3. SKOR KLINIS", h=10, style="B", size=12)
    pdf.set_fill_color(230, 230, 230)
    baris(f"Total NIHSS Score: {data.get('nihss', 0)} ({data.get('nihss_interp', '-')})", fill=True)
    if data.get('nihss_un'):
        baris(f"Item NIHSS tidak dapat dinilai (UN): {data['nihss_un']}", size=10)
    baris(f"Nyeri (NRS): Diam={data.get('nrs_d', 0)} | Gerak={data.get('nrs_g', 0)}")
    if data.get('kps'):
        baris(f"Karnofsky Score: {data.get('kps')}")

    pdf.ln(10)
    baris("*Dokumen ini digenerate otomatis oleh NeuroLog App", h=10, style="I", size=8, align="C")

    return bytes(pdf.output())

# --- TAB NAVIGASI ---
tab1, tab2, tab3, tab4, tab5 = st.tabs(["👤 Identitas", "🧠 NIHSS (Stroke)", "⚡ NRS (Nyeri)", "🎗️ KPS (Tumor)", "📊 Resume & PDF"])

# --- TAB 1: IDENTITAS ---
with tab1:
    st.header("Data Pasien")
    c1, c2 = st.columns(2)
    with c1:
        nama_koas = st.text_input("Nama Koas", key="koas")
        no_rm = st.text_input("No. RM", key="rm")
    with c2:
        usia = st.number_input("Usia", min_value=0, key="usia")
        diagnosis = st.text_input("Diagnosis", key="diag")
    
    st.subheader("Tanda Vital")
    vc1, vc2, vc3 = st.columns(3)
    with vc1:
        td = st.text_input("TD (mmHg)", "120/80")
    with vc2:
        hr = st.text_input("Nadi (x/i)", "80")
        rr = st.text_input("RR (x/i)", "20")
    with vc3:
        temp = st.text_input("Suhu (C)", "36.5")

# --- TAB 2: NIHSS ---
with tab2:
    st.header("Kalkulator NIHSS")
    st.info("Isi setiap poin di bawah ini:")
    
    # Helper function
    def nihss_opt(label, options, key):
        return st.selectbox(label, options, format_func=lambda x: f"{x[0]} - {x[1]}", key=key)

    n1a = nihss_opt("1a. Kesadaran", [(0,"Sadar"), (1,"Somnolen"), (2,"Stupor"), (3,"Koma")], "n1a")
    n1b = nihss_opt("1b. Menjawab (Usia+Bulan)", [(0,"Benar 2"), (1,"Benar 1"), (2,"Salah Semua")], "n1b")
    n1c = nihss_opt("1c. Perintah (Mata+Genggam)", [(0,"Benar 2"), (1,"Benar 1"), (2,"Salah Semua")], "n1c")
    n2 = nihss_opt("2. Gaze (Gerak Mata)", [(0,"Normal"), (1,"Parsial"), (2,"Deviasi Paksa")], "n2")
    n3 = nihss_opt("3. Visual", [(0,"Normal"), (1,"Hemianopia Parsial"), (2,"Hemianopia Komplit"), (3,"Bilateral")], "n3")
    n4 = nihss_opt("4. Wajah", [(0,"Normal"), (1,"Minor"), (2,"Parsial"), (3,"Komplit")], "n4")
    # Item motorik (NIHSS 5-6). "UN" = untestable (amputasi / fusi sendi): tidak dijumlahkan.
    UN = ("UN", "Tidak dapat dinilai (amputasi / fusi sendi)")
    lengan = [(0, "Tidak drift, tahan 10 dtk"), (1, "Drift, turun sebelum 10 dtk tapi tidak menyentuh kasur"),
              (2, "Ada usaha melawan gravitasi, jatuh ke kasur sebelum 10 dtk"),
              (3, "Tidak ada usaha melawan gravitasi, langsung jatuh"), (4, "Tidak ada gerakan"), UN]
    tungkai = [(0, "Tidak drift, tahan 5 dtk"), (1, "Drift, turun sebelum 5 dtk tapi tidak menyentuh kasur"),
               (2, "Ada usaha melawan gravitasi, jatuh ke kasur sebelum 5 dtk"),
               (3, "Tidak ada usaha melawan gravitasi, langsung jatuh"), (4, "Tidak ada gerakan"), UN]
    n5a = nihss_opt("5a. Motorik Lengan Kiri", lengan, "n5a")
    n5b = nihss_opt("5b. Motorik Lengan Kanan", lengan, "n5b")
    n6a = nihss_opt("6a. Motorik Tungkai Kiri", tungkai, "n6a")
    n6b = nihss_opt("6b. Motorik Tungkai Kanan", tungkai, "n6b")
    n7 = nihss_opt("7. Ataksia", [(0,"Absen"), (1,"1 Anggota"), (2,"2 Anggota"), UN], "n7")
    st.caption("Ataksia diberi skor 0 bila pasien plegi atau tidak memahami perintah.")
    n8 = nihss_opt("8. Sensorik", [(0,"Normal"), (1,"Ringan"), (2,"Berat")], "n8")
    n9 = nihss_opt("9. Bahasa", [(0,"Normal"), (1,"Afasia Ringan"), (2,"Afasia Berat"), (3,"Mute")], "n9")
    n10 = nihss_opt("10. Disartria", [(0,"Normal"), (1,"Ringan"), (2,"Berat"),
                                      ("UN", "Tidak dapat dinilai (intubasi / hambatan fisik)")], "n10")
    n11 = nihss_opt("11. Pengabaian (Neglect)", [(0,"Absen"), (1,"Parsial"), (2,"Komplit")], "n11")

    semua_item = {"1a": n1a, "1b": n1b, "1c": n1c, "2": n2, "3": n3, "4": n4,
                  "5a": n5a, "5b": n5b, "6a": n6a, "6b": n6b, "7": n7, "8": n8,
                  "9": n9, "10": n10, "11": n11}
    total_nihss = sum(v[0] for v in semua_item.values() if v[0] != "UN")
    item_un = [k for k, v in semua_item.items() if v[0] == "UN"]

    # Interpretasi
    if total_nihss == 0: nihss_interp = "Normal"
    elif total_nihss <= 4: nihss_interp = "Stroke Ringan"
    elif total_nihss <= 15: nihss_interp = "Stroke Sedang"
    elif total_nihss <= 20: nihss_interp = "Stroke Sedang-Berat"
    else: nihss_interp = "Stroke Berat"
    
    st.metric(label="Total Skor NIHSS", value=total_nihss, delta=nihss_interp, delta_color="inverse")
    if item_un:
        st.warning(f"Item tidak dapat dinilai (UN), tidak dijumlahkan: {', '.join(item_un)}")

# --- TAB 3: NRS ---
with tab3:
    st.header("Penilaian Nyeri (NRS)")
    
    def interpretasi_nrs(skor):
        if skor == 0: st.success("😊 Tidak Nyeri")
        elif skor <= 3: st.info("🙂 Nyeri Ringan")
        elif skor <= 6: st.warning("😐 Nyeri Sedang")
        else: st.error("😫 Nyeri Berat")

    col_pain1, col_pain2 = st.columns(2)
    with col_pain1:
        st.write("### Saat Diam")
        nrs_d = st.slider("Skala 0-10", 0, 10, 0, key="nrs_d")
        interpretasi_nrs(nrs_d)

    with col_pain2:
        st.write("### Saat Gerak")
        nrs_g = st.slider("Skala 0-10", 0, 10, 0, key="nrs_g")
        interpretasi_nrs(nrs_g)

# --- TAB 4: KPS ---
with tab4:
    st.header("Karnofsky Performance Score")
    kps_opts = [
        (100, "100 - Normal, tidak ada keluhan"), (90, "90 - Gejala ringan"), (80, "80 - Gejala ada, aktivitas normal"),
        (70, "70 - Mandiri, tak mampu kerja"), (60, "60 - Butuh bantuan sesekali"), (50, "50 - Butuh bantuan sering"),
        (40, "40 - Disable"), (30, "30 - Rawat Inap"), (20, "20 - Sakit berat"), (10, "10 - Sekarat"), (0, "0 - Meninggal")
    ]
    kps = st.selectbox("Pilih kondisi pasien:", kps_opts, format_func=lambda x: x[1])
    st.metric("Skor KPS", f"{kps[0]}%")

# --- TAB 5: RESUME & PDF ---
with tab5:
    st.header("📊 Dashboard Resume")
    
    # Data Dictionary
    data_final = {
        'koas': nama_koas, 'rm': no_rm, 'usia': usia, 'diagnosis': diagnosis,
        'td': td, 'hr': hr, 'rr': rr, 'temp': temp,
        'nihss': total_nihss, 'nihss_interp': nihss_interp,
        'nrs_d': nrs_d, 'nrs_g': nrs_g,
        'kps': kps[1],
        'nihss_un': ", ".join(item_un)
    }

    # Grafik Visualisasi (Bar Chart Sederhana)
    st.subheader("Visualisasi Skor")
    chart_data = pd.DataFrame({
        'Parameter': ['NIHSS', 'NRS Diam', 'NRS Gerak'],
        'Skor': [total_nihss, nrs_d, nrs_g],
        'Batas Maks': [42, 10, 10] # Sebagai pembanding visual
    })
    st.bar_chart(chart_data, x='Parameter', y='Skor')

    st.divider()
    
    # Tombol Download PDF
    st.subheader("🖨️ Cetak Laporan")
    if st.button("Generate PDF Report"):
        if not nama_koas or not no_rm:
            st.warning("⚠️ Mohon isi Nama Koas dan No. RM di Tab Identitas dulu!")
        else:
            pdf_bytes = create_pdf(data_final)
            st.success("PDF Berhasil Dibuat!")
            st.download_button(
                label="📥 Klik untuk Download PDF",
                data=pdf_bytes,
                file_name=f"Laporan_{no_rm}_{datetime.now().strftime('%Y%m%d')}.pdf",
                mime='application/pdf'
            )
