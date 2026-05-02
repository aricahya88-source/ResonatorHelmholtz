import { useState } from 'react';
import {
  BookOpen,
  Calculator,
  FlaskConical,
  Gauge,
  ListMusic,
  Mic,
  Music2,
  Sigma,
  SlidersHorizontal,
  Waves,
} from 'lucide-react';
import { LatexMath } from './Math';

const materialTopics = [
  { id: 'konsep', label: 'Konsep dasar', icon: Waves },
  { id: 'rumus', label: 'Rumus utama', icon: Sigma },
  { id: 'massa-pegas', label: 'Model massa–pegas', icon: Gauge },
  { id: 'geometri', label: 'Geometri & koreksi ujung', icon: SlidersHorizontal },
  { id: 'praktikum', label: 'Praktikum mikrofon', icon: Mic },
  { id: 'tangga-nada', label: 'Konsep tangga nada', icon: Music2 },
  { id: 'keterbatasan', label: 'Keterbatasan model', icon: FlaskConical },
  { id: 'referensi', label: 'Referensi APA', icon: BookOpen },
] as const;

type TopicId = (typeof materialTopics)[number]['id'];

const scaleNotes = [
  { no: 1, solmization: 'Do', musicNote: 'C4', frequencyHz: 261.63 },
  { no: 2, solmization: 'Re', musicNote: 'D4', frequencyHz: 293.66 },
  { no: 3, solmization: 'Mi', musicNote: 'E4', frequencyHz: 329.63 },
  { no: 4, solmization: 'Fa', musicNote: 'F4', frequencyHz: 349.23 },
  { no: 5, solmization: 'Sol', musicNote: 'G4', frequencyHz: 392.0 },
  { no: 6, solmization: 'La', musicNote: 'A4', frequencyHz: 440.0 },
  { no: 7, solmization: 'Si', musicNote: 'B4', frequencyHz: 493.88 },
  { no: 8, solmization: 'Do tinggi', musicNote: 'C5', frequencyHz: 523.25 },
  { no: 9, solmization: 'Re tinggi', musicNote: 'D5', frequencyHz: 587.33 },
  { no: 10, solmization: 'Mi tinggi', musicNote: 'E5', frequencyHz: 659.25 },
  { no: 11, solmization: 'Fa tinggi', musicNote: 'F5', frequencyHz: 698.46 },
  { no: 12, solmization: 'Sol tinggi', musicNote: 'G5', frequencyHz: 783.99 },
  { no: 13, solmization: 'La tinggi', musicNote: 'A5', frequencyHz: 880.0 },
  { no: 14, solmization: 'Si tinggi', musicNote: 'B5', frequencyHz: 987.77 },
  { no: 15, solmization: 'Do sangat tinggi', musicNote: 'C6', frequencyHz: 1046.5 },
];

function formatHz(value: number) {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function MaterialPanel() {
  const [activeTopic, setActiveTopic] = useState<TopicId>('konsep');

  return (
    <section className="material-section">
      <div className="section-heading-row material-heading">
        <div>
          <p className="eyebrow">Section 1 · Materi</p>
          <h2 className="icon-heading hero-icon-heading"><BookOpen size={34} /> Materi Resonator Helmholtz</h2>
        </div>
        <p>
          Bagian ini menjelaskan konsep fisika, persamaan matematis, praktikum mikrofon, serta hubungan resonansi botol dengan tangga nada. Persamaan dirender memakai KaTeX agar notasi LaTeX tampil rapi di browser.
        </p>
      </div>

      <div className="material-layout">
        <article className="panel material-content">
          {activeTopic === 'konsep' ? (
            <div className="material-topic">
              <p className="eyebrow">Konsep dasar</p>
              <h3>Resonansi pada botol sebagai resonator Helmholtz</h3>
              <p>
                Resonator Helmholtz adalah sistem akustik yang terdiri dari rongga udara dan leher sempit. Ketika mulut botol ditiup, udara di leher bergerak bolak-balik, sedangkan udara di dalam rongga mengalami kompresi dan ekspansi. Sistem ini memiliki frekuensi alami tertentu; bunyi terdengar paling kuat ketika eksitasi tiupan mendekati frekuensi alami tersebut (Kinsler et al., 2000; Morse &amp; Ingard, 1968).
              </p>
              <div className="material-cards two-cols">
                <section>
                  <h4>Udara di leher</h4>
                  <p>Udara di leher berperan sebagai massa inersial. Gerak utamanya relatif jelas karena luas leher lebih kecil dibanding luas rongga.</p>
                </section>
                <section>
                  <h4>Udara di rongga</h4>
                  <p>Udara di rongga berperan sebagai pegas kompresibel. Tekanan rongga naik ketika udara masuk dan turun ketika udara keluar.</p>
                </section>
              </div>
              <p>
                Model edukatif pada aplikasi tidak memerlukan simulasi fluida penuh. Animasi partikel dapat dikendalikan oleh frekuensi resonansi, karena dokumen rancangan aplikasi menempatkan model massa–pegas sebagai pendekatan utama untuk visualisasi partikel udara.
              </p>
            </div>
          ) : null}

          {activeTopic === 'rumus' ? (
            <div className="material-topic">
              <p className="eyebrow">Rumus utama</p>
              <h3>Persamaan frekuensi resonansi Helmholtz</h3>
              <p>
                Bentuk klasik frekuensi resonansi Helmholtz memakai luas penampang leher <LatexMath formula={String.raw`A`} />, volume udara dalam rongga <LatexMath formula={String.raw`V`} />, cepat rambat bunyi <LatexMath formula={String.raw`c`} />, dan panjang efektif leher <LatexMath formula={String.raw`L_{\mathrm{eff}}`} /> (Ingard, 1953; Kinsler et al., 2000).
              </p>
              <LatexMath block label="Frekuensi sudut dan frekuensi resonansi" formula={String.raw`\omega_H=c\sqrt{\frac{A}{V L_{\mathrm{eff}}}},\qquad f_H=\frac{\omega_H}{2\pi}=\frac{c}{2\pi}\sqrt{\frac{A}{V L_{\mathrm{eff}}}}`} />
              <p>
                Untuk leher botol berbentuk lingkaran dengan jari-jari <LatexMath formula={String.raw`a`} />, luas penampang leher menjadi:
              </p>
              <LatexMath block label="Luas leher bundar" formula={String.raw`A=\pi a^2`} />
              <p>
                Cepat rambat bunyi dapat dibuat bergantung pada suhu udara. Untuk aplikasi edukatif, pendekatan linear berikut cukup sering digunakan:
              </p>
              <LatexMath block label="Cepat rambat bunyi terhadap suhu" formula={String.raw`c\approx 331.3+0.606T`} />
              <p>
                Makna parameternya langsung: frekuensi naik ketika <LatexMath formula={String.raw`A`} /> membesar atau <LatexMath formula={String.raw`V`} /> mengecil; frekuensi turun ketika <LatexMath formula={String.raw`L_{\mathrm{eff}}`} /> membesar. Oleh karena itu, penambahan air menaikkan nada karena volume udara efektif mengecil.
              </p>
            </div>
          ) : null}

          {activeTopic === 'massa-pegas' ? (
            <div className="material-topic">
              <p className="eyebrow">Model massa–pegas</p>
              <h3>Turunan sederhana dari gerak sumbat udara</h3>
              <p>
                Turunan model massa–pegas menganggap udara di leher sebagai “sumbat udara” yang bergerak sejauh <LatexMath formula={String.raw`x(t)`} />. Massa efektif udara di leher ditulis sebagai (Morse &amp; Ingard, 1968):
              </p>
              <LatexMath block label="Massa efektif udara leher" formula={String.raw`m_{\mathrm{ef}}=\rho_0 A L_{\mathrm{eff}}`} />
              <p>
                Ketika sumbat udara masuk sejauh <LatexMath formula={String.raw`x`} />, perubahan volume rongga sebesar <LatexMath formula={String.raw`\Delta V=-Ax`} />. Untuk kompresi adiabatik kecil, tekanan akustik rongga menjadi:
              </p>
              <LatexMath block label="Tekanan akustik rongga" formula={String.raw`p'=-\rho_0 c^2\frac{A x}{V}`} />
              <p>
                Gaya pemulih pada sumbat udara adalah:
              </p>
              <LatexMath block label="Gaya pemulih" formula={String.raw`F=A p'=-\rho_0 c^2\frac{A^2}{V}x`} />
              <p>
                Persamaan geraknya menjadi osilator harmonik sederhana:
              </p>
              <LatexMath block label="Persamaan gerak" formula={String.raw`\rho_0 A L_{\mathrm{eff}}\ddot{x}+\rho_0 c^2\frac{A^2}{V}x=0`} />
              <LatexMath block label="Bentuk normal" formula={String.raw`\ddot{x}+\frac{c^2A}{V L_{\mathrm{eff}}}x=0`} />
              <p>
                Konstanta pegas efektif dan massa efektif dapat ditulis:
              </p>
              <LatexMath block label="Analogi mekanik" formula={String.raw`k_{\mathrm{ef}}=\rho_0 c^2\frac{A^2}{V},\qquad m_{\mathrm{ef}}=\rho_0 A L_{\mathrm{eff}}`} />
              <LatexMath block label="Frekuensi sudut dari analogi massa–pegas" formula={String.raw`\omega_H=\sqrt{\frac{k_{\mathrm{ef}}}{m_{\mathrm{ef}}}}=c\sqrt{\frac{A}{V L_{\mathrm{eff}}}}`} />
              <p>
                Logika animasi pada aplikasi mengikuti persamaan ini: partikel di leher dibuat berosilasi lebih jelas sebagai massa, sedangkan partikel di rongga menunjukkan kompresi dan ekspansi tekanan.
              </p>
            </div>
          ) : null}

          {activeTopic === 'geometri' ? (
            <div className="material-topic">
              <p className="eyebrow">Geometri & koreksi ujung</p>
              <h3>Panjang efektif leher tidak sama dengan panjang geometrik</h3>
              <p>
                Pada resonator nyata, udara di dekat ujung leher juga ikut berosilasi. Akibatnya, panjang yang dipakai dalam persamaan bukan hanya panjang geometrik leher <LatexMath formula={String.raw`L`} />, tetapi panjang efektif <LatexMath formula={String.raw`L_{\mathrm{eff}}`} /> (Ingard, 1953; Levine &amp; Schwinger, 1948).
              </p>
              <LatexMath block label="Panjang efektif leher" formula={String.raw`L_{\mathrm{eff}}=L+\delta_i+\delta_o`} />
              <div className="material-table-wrap">
                <table className="material-table">
                  <thead>
                    <tr><th>Geometri ujung</th><th>Koreksi umum</th><th>Bentuk praktis</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Ujung pipa tanpa flange</td><td><LatexMath formula={String.raw`\delta\approx0.61a`} /></td><td>Satu ujung terbuka tak berflens</td></tr>
                    <tr><td>Ujung pipa berflange</td><td><LatexMath formula={String.raw`\delta\approx0.82a`} /></td><td>Dekat hasil radiasi berflens</td></tr>
                    <tr><td>Orifice/lubang tipis</td><td><LatexMath formula={String.raw`\delta\approx0.85a`} /> per sisi</td><td><LatexMath formula={String.raw`L_{\mathrm{eff}}\approx L+1.70a`} /></td></tr>
                  </tbody>
                </table>
              </div>
              <p>
                Nilai koreksi ujung bukan konstanta universal. Nilai <LatexMath formula={String.raw`0.61a`} />, <LatexMath formula={String.raw`0.82a`} />, dan <LatexMath formula={String.raw`0.85a`} /> muncul karena kondisi batas dan bentuk geometri berbeda. Aplikasi memakai pilihan <LatexMath formula={String.raw`L_{\mathrm{eff}}=L+1.70a`} /> sebagai pendekatan praktis botol sederhana, tetapi pengguna tetap dapat membandingkannya melalui hasil praktikum.
              </p>
              <LatexMath block label="Frekuensi botol dengan koreksi praktis" formula={String.raw`f_H=\frac{c}{2\pi}\sqrt{\frac{\pi a^2}{V(L+1.70a)}}`} />
            </div>
          ) : null}

          {activeTopic === 'praktikum' ? (
            <div className="material-topic">
              <p className="eyebrow">Praktikum mikrofon</p>
              <h3>Menghubungkan teori dengan botol asli</h3>
              <p>
                Mikrofon laptop dapat digunakan untuk estimasi frekuensi resonansi botol, terutama karena nada botol yang ditiup biasanya berada pada rentang ratusan hertz. Web Audio API membaca sinyal mikrofon, kemudian <em>Fast Fourier Transform</em> memetakan sinyal waktu menjadi spektrum frekuensi. Puncak terbesar pada rentang 80–1500 Hz dipakai sebagai estimasi frekuensi aktual.
              </p>
              <LatexMath block label="Alur estimasi frekuensi" formula={String.raw`x(t)\xrightarrow{\mathrm{FFT}}X(f)\quad\Rightarrow\quad f_{\mathrm{aktual}}=\arg\max_{80\le f\le1500}|X(f)|`} />
              <p>
                Frekuensi aktual dari mikrofon dapat dibandingkan dengan frekuensi teoritis. Selisihnya ditulis:
              </p>
              <LatexMath block label="Selisih teori dan eksperimen" formula={String.raw`\Delta f=f_{\mathrm{aktual}}-f_H,\qquad \%\,\Delta f=\frac{f_{\mathrm{aktual}}-f_H}{f_H}\times100\%`} />
              <p>
                Aplikasi juga dapat menghitung balik koreksi ujung praktikum. Jika frekuensi mikrofon dianggap sebagai frekuensi resonansi, maka panjang efektif hasil eksperimen adalah:
              </p>
              <LatexMath block label="Panjang efektif dari frekuensi aktual" formula={String.raw`L_{\mathrm{eff,praktikum}}=\frac{A}{V(2\pi f_{\mathrm{aktual}}/c)^2}`} />
              <LatexMath block label="Faktor koreksi ujung dalam satuan radius" formula={String.raw`\alpha_{\mathrm{praktikum}}=\frac{L_{\mathrm{eff,praktikum}}-L}{a}`} />
              <p>
                Nilai <LatexMath formula={String.raw`\alpha_{\mathrm{praktikum}}`} /> dapat dibandingkan dengan nilai teoritis <LatexMath formula={String.raw`1.70`} /> untuk pendekatan botol sederhana. Karena mikrofon laptop tidak terkalibrasi, hasil ini lebih tepat disebut estimasi edukatif, bukan pengukuran laboratorium presisi.
              </p>
            </div>
          ) : null}

          {activeTopic === 'tangga-nada' ? (
            <div className="material-topic">
              <p className="eyebrow">Konsep tangga nada</p>
              <h3>Mengatur volume air agar botol mendekati nada musik</h3>
              <p>
                Tangga nada pada menu aplikasi memakai frekuensi target dari C4 sampai C6. Dalam sistem temperamen sama, hubungan antar nada semiton mengikuti rasio <LatexMath formula={String.raw`2^{1/12}`} />. Dengan acuan A4 = 440 Hz, frekuensi nada ke-<LatexMath formula={String.raw`n`} /> semiton dari A4 dapat dihitung sebagai (Fletcher &amp; Rossing, 1998):
              </p>
              <LatexMath block label="Frekuensi temperamen sama" formula={String.raw`f_n=440\times2^{n/12}`} />
              <p>
                Dalam botol Helmholtz, nada target dapat didekati dengan mengubah volume udara. Dari persamaan Helmholtz, volume udara yang dibutuhkan untuk frekuensi target <LatexMath formula={String.raw`f_{\mathrm{target}}`} /> adalah:
              </p>
              <LatexMath block label="Volume udara target" formula={String.raw`V_{\mathrm{target}}=\frac{A}{(2\pi f_{\mathrm{target}}/c)^2L_{\mathrm{eff}}}`} />
              <p>
                Jika volume total botol adalah <LatexMath formula={String.raw`V_{\mathrm{total}}`} />, maka tinggi air ideal secara persentase dapat dihitung dengan pendekatan:
              </p>
              <LatexMath block label="Persentase tinggi air target" formula={String.raw`h_{\mathrm{air}}=\left(1-\frac{V_{\mathrm{target}}}{V_{\mathrm{total}}}\right)\times100\%`} />
              <div className="material-table-wrap">
                <table className="material-table note-table">
                  <thead>
                    <tr><th>No.</th><th>Solmisasi</th><th>Nada Musik</th><th>Frekuensi Target</th></tr>
                  </thead>
                  <tbody>
                    {scaleNotes.map((note) => (
                      <tr key={note.no}>
                        <td>{note.no}</td>
                        <td>{note.solmization}</td>
                        <td>{note.musicNote}</td>
                        <td>{formatHz(note.frequencyHz)} Hz</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {activeTopic === 'keterbatasan' ? (
            <div className="material-topic">
              <p className="eyebrow">Keterbatasan model</p>
              <h3>Kapan model klasik perlu hati-hati?</h3>
              <p>
                Persamaan Helmholtz klasik adalah aproksimasi <em>lumped</em> frekuensi rendah. Model bekerja baik ketika ukuran rongga dan leher jauh lebih kecil daripada panjang gelombang, amplitudo kecil, dinding kaku, dan tidak ada aliran rata-rata yang dominan (Panton &amp; Miller, 1975; Chanaud, 1994).
              </p>
              <LatexMath block label="Panjang gelombang" formula={String.raw`\lambda=\frac{c}{f}`} />
              <p>
                Salah satu aturan praktis untuk memeriksa sifat kompak adalah memastikan dimensi utama botol jauh lebih kecil daripada panjang gelombang. Pada resonator silinder yang memanjang, literatur menunjukkan bahwa model klasik mulai kehilangan akurasi ketika panjang rongga tidak lagi cukup kecil terhadap panjang gelombang.
              </p>
              <div className="material-cards two-cols">
                <section>
                  <h4>Yang belum dimodelkan</h4>
                  <p>Rugi viskos-termal, radiasi, turbulensi tepi, <em>vortex shedding</em>, kebocoran, dan pengaruh mikrofon laptop.</p>
                </section>
                <section>
                  <h4>Implikasi praktis</h4>
                  <p>Frekuensi teoritis perlu dibandingkan dengan frekuensi aktual mikrofon. Perbedaan dapat dipakai untuk mengevaluasi koreksi ujung dan kualitas asumsi geometri.</p>
                </section>
              </div>
            </div>
          ) : null}

          {activeTopic === 'referensi' ? (
            <div className="material-topic reference-topic">
              <p className="eyebrow">Referensi APA</p>
              <h3>Daftar pustaka utama</h3>
              <p>
                Sitasi di materi menggunakan format <em>body note</em> APA, sedangkan daftar pustaka di bawah mengikuti APA 7th edition.
              </p>
              <ol className="reference-list">
                <li>Chanaud, R. C. (1994). Effects of geometry on the resonance frequency of Helmholtz resonators. <em>Journal of Sound and Vibration, 178</em>(3), 337–348. https://doi.org/10.1006/jsvi.1994.1490</li>
                <li>Fletcher, N. H., &amp; Rossing, T. D. (1998). <em>The physics of musical instruments</em> (2nd ed.). Springer.</li>
                <li>Helmholtz, H. von. (1860). Theorie der Luftschwingungen in Röhren mit offenen Enden. <em>Journal für die reine und angewandte Mathematik, 57</em>, 1–72. https://doi.org/10.1515/crll.1860.57.1</li>
                <li>Ingard, U. (1953). On the theory and design of acoustic resonators. <em>The Journal of the Acoustical Society of America, 25</em>(6), 1037–1061. https://doi.org/10.1121/1.1907235</li>
                <li>Kinsler, L. E., Frey, A. R., Coppens, A. B., &amp; Sanders, J. V. (2000). <em>Fundamentals of acoustics</em> (4th ed.). John Wiley &amp; Sons.</li>
                <li>Levine, H., &amp; Schwinger, J. (1948). On the radiation of sound from an unflanged circular pipe. <em>Physical Review, 73</em>(4), 383–406. https://doi.org/10.1103/PhysRev.73.383</li>
                <li>Morse, P. M., &amp; Ingard, K. U. (1968). <em>Theoretical acoustics</em>. McGraw-Hill.</li>
                <li>Panton, R. L., &amp; Miller, J. M. (1975). Resonant frequencies of cylindrical Helmholtz resonators. <em>The Journal of the Acoustical Society of America, 57</em>(6), 1533–1535. https://doi.org/10.1121/1.380596</li>
              </ol>
            </div>
          ) : null}
        </article>

        <aside className="material-submenu panel" aria-label="Sub menu materi">
          <div className="panel-title-group compact-title">
            <p className="eyebrow">Sub menu</p>
            <h2 className="icon-heading"><ListMusic size={22} /> Navigasi Materi</h2>
          </div>
          <div className="material-submenu-buttons">
            {materialTopics.map((topic) => {
              const Icon = topic.icon;
              return (
                <button
                  key={topic.id}
                  type="button"
                  className={activeTopic === topic.id ? 'material-submenu-button active' : 'material-submenu-button'}
                  onClick={() => setActiveTopic(topic.id)}
                >
                  <Icon size={19} aria-hidden="true" />
                  {topic.label}
                </button>
              );
            })}
          </div>
          <div className="katex-note">
            <Calculator size={20} />
            <p>
              Rekomendasi teknis: paket <strong>KaTeX</strong> dipakai langsung melalui komponen React kecil. Cara ini ringan, cepat, dan stabil untuk Vite + TypeScript.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
