/**
 * AnalyticsExport.jsx
 * Drop into: src/components/dashboard/AnalyticsExport.jsx
 *
 * Usage — add to any page:
 *   import AnalyticsExport from '../components/dashboard/AnalyticsExport'
 *   <AnalyticsExport />
 *
 * Exports:
 *   CSV     — flat waste_log data, opens in any spreadsheet app
 *   Excel   — multi-sheet workbook (Waste Summary, Inventory, Predictions, PowerBI_Data)
 *   Power BI — same Excel file with a note that Power BI reads it directly
 */

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Download, FileSpreadsheet, FileText, BarChart2, Loader, ChevronDown } from 'lucide-react'

// ─── tiny Excel builder (no library needed) ───────────────────
// Generates a real .xlsx using the Office Open XML format.
// Supports: multiple sheets, bold/color cell styles, number formats.

function escXml(v) {
  if (v === null || v === undefined) return ''
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function colLetter(n) {
  let s = ''
  while (n > 0) {
    n--
    s = String.fromCharCode(65 + (n % 26)) + s
    n = Math.floor(n / 26)
  }
  return s
}

function buildXlsx(sheets) {
  // sheets: [{ name, headers, rows, colWidths }]
  // rows: array of arrays — each cell can be string | number | { v, bold, color, bg, fmt }

  const STYLES = {
    headerFill:  '059669',
    headerFont:  'FFFFFF',
    accentFill:  'ECFDF5',
    accentFont:  '059669',
    mutedFont:   '71717A',
    dangerFont:  'DC2626',
    amberFont:   'D97706',
    borderColor: 'E4E4E7',
  }

  // Build shared strings
  const strings = []
  const strMap  = {}
  function si(s) {
    const k = String(s)
    if (strMap[k] === undefined) { strMap[k] = strings.length; strings.push(k) }
    return strMap[k]
  }

  // Pre-collect all strings
  for (const { headers, rows } of sheets) {
    headers.forEach(h => si(h))
    rows.forEach(row => row.forEach(cell => {
      const v = cell?.v ?? cell
      if (typeof v === 'string') si(v)
    }))
  }

  // Build worksheet XML for each sheet
  function buildSheet(sheetData) {
    const { headers, rows, colWidths = [] } = sheetData
    let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    xml += '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'
    xml += ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'

    // Column widths
    if (colWidths.length) {
      xml += '<cols>'
      colWidths.forEach((w, i) => {
        xml += `<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`
      })
      xml += '</cols>'
    }

    xml += '<sheetData>'

    // Header row
    xml += '<row r="1" ht="20" customHeight="1">'
    headers.forEach((h, ci) => {
      const ref = `${colLetter(ci+1)}1`
      xml += `<c r="${ref}" t="s" s="1"><v>${si(h)}</v></c>`
    })
    xml += '</row>'

    // Data rows
    rows.forEach((row, ri) => {
      const rowNum = ri + 2
      const isAlt  = ri % 2 === 1
      xml += `<row r="${rowNum}" ht="18" customHeight="1">`
      row.forEach((cell, ci) => {
        const ref  = `${colLetter(ci+1)}${rowNum}`
        const raw  = cell?.v ?? cell
        const bold = cell?.bold ?? false
        const fmt  = cell?.fmt ?? null

        let styleIdx = isAlt ? 3 : 2
        if (bold) styleIdx = isAlt ? 5 : 4
        if (fmt === 'currency') styleIdx = isAlt ? 7 : 6
        if (fmt === 'pct')     styleIdx = isAlt ? 9 : 8
        if (fmt === 'date')    styleIdx = isAlt ? 11 : 10

        if (typeof raw === 'number') {
          xml += `<c r="${ref}" s="${styleIdx}"><v>${raw}</v></c>`
        } else {
          xml += `<c r="${ref}" t="s" s="${styleIdx}"><v>${si(raw ?? '')}</v></c>`
        }
      })
      xml += '</row>'
    })

    xml += '</sheetData></worksheet>'
    return xml
  }

  // Styles XML (simplified — 12 styles covering header / normal / alt / bold / currency / pct / date)
  const styleXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="4">
    <font><sz val="9"/><name val="Arial"/></font>
    <font><sz val="9"/><b/><color rgb="FF${STYLES.headerFont}"/><name val="Arial"/></font>
    <font><sz val="9"/><b/><name val="Arial"/></font>
    <font><sz val="9"/><color rgb="FF${STYLES.mutedFont}"/><name val="Arial"/></font>
  </fonts>
  <fills count="4">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF${STYLES.headerFill}"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFAFAFA"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FF${STYLES.borderColor}"/></left>
      <right style="thin"><color rgb="FF${STYLES.borderColor}"/></right>
      <top style="thin"><color rgb="FF${STYLES.borderColor}"/></top>
      <bottom style="thin"><color rgb="FF${STYLES.borderColor}"/></bottom>
    </border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="12">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFill="1" applyFont="1" applyBorder="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment vertical="center"/></xf>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyNumberFormat="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="164" fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyNumberFormat="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="9"   fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyNumberFormat="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="9"   fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyNumberFormat="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="14"  fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyNumberFormat="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="14"  fontId="0" fillId="3" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyNumberFormat="1"><alignment horizontal="center" vertical="center"/></xf>
  </cellXfs>
  <numFmts count="1">
    <numFmt numFmtId="164" formatCode="&quot;₹&quot;#,##0"/>
  </numFmts>
</styleSheet>`

  // Shared strings XML
  const ssXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${strings.length}" uniqueCount="${strings.length}">
${strings.map(s => `<si><t xml:space="preserve">${escXml(s)}</t></si>`).join('')}
</sst>`

  // Workbook XML
  const wbXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
${sheets.map((s, i) => `    <sheet name="${escXml(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('\n')}
  </sheets>
</workbook>`

  // Workbook rels
  const wbRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${sheets.map((_, i) => `  <Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('\n')}
  <Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
  <Relationship Id="rId${sheets.length+2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml"  ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${sheets.map((_, i) => `  <Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('\n')}
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`

  return {
    '[Content_Types].xml':   contentTypes,
    '_rels/.rels':           rootRels,
    'xl/workbook.xml':       wbXml,
    'xl/_rels/workbook.xml.rels': wbRels,
    'xl/sharedStrings.xml':  ssXml,
    'xl/styles.xml':         styleXml,
    ...Object.fromEntries(
      sheets.map((s, i) => [`xl/worksheets/sheet${i+1}.xml`, buildSheet(s)])
    ),
  }
}

// ─── ZIP builder (no library needed) ─────────────────────────
// Minimal ZIP implementation — stores files uncompressed (method 0).
// Good enough for xlsx; all major tools accept it.

function toBytes(str) {
  const enc = new TextEncoder()
  return enc.encode(str)
}

function u32le(n) {
  return [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >> 24) & 0xff]
}
function u16le(n) { return [n & 0xff, (n >> 8) & 0xff] }

function crc32(data) {
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256)
    for (let i = 0; i < 256; i++) {
      let c = i
      for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      t[i] = c
    }
    return t
  })())
  let c = 0xffffffff
  for (const b of data) c = table[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function buildZip(files) {
  const entries = []
  const parts   = []
  let offset = 0

  for (const [name, content] of Object.entries(files)) {
    const nameBytes = toBytes(name)
    const data      = typeof content === 'string' ? toBytes(content) : content
    const crc       = crc32(data)
    const size      = data.length

    const local = new Uint8Array([
      0x50, 0x4b, 0x03, 0x04,          // local file header sig
      ...u16le(20),                     // version needed
      ...u16le(0),                      // flags
      ...u16le(0),                      // compression (0=store)
      ...u16le(0), ...u16le(0),         // mod time/date
      ...u32le(crc),
      ...u32le(size),
      ...u32le(size),
      ...u16le(nameBytes.length),
      ...u16le(0),                      // extra length
      ...nameBytes,
    ])

    parts.push(local, data)
    entries.push({ nameBytes, crc, size, offset })
    offset += local.length + size
  }

  const central = []
  for (const { nameBytes, crc, size, offset } of entries) {
    central.push(new Uint8Array([
      0x50, 0x4b, 0x01, 0x02,
      ...u16le(20), ...u16le(20),
      ...u16le(0), ...u16le(0),
      ...u16le(0), ...u16le(0),
      ...u32le(crc),
      ...u32le(size), ...u32le(size),
      ...u16le(nameBytes.length),
      ...u16le(0), ...u16le(0),
      ...u16le(0), ...u16le(0),
      ...u32le(0),
      ...u32le(offset),
      ...nameBytes,
    ]))
  }

  const cdSize   = central.reduce((s, b) => s + b.length, 0)
  const eocd     = new Uint8Array([
    0x50, 0x4b, 0x05, 0x06,
    ...u16le(0), ...u16le(0),
    ...u16le(entries.length), ...u16le(entries.length),
    ...u32le(cdSize),
    ...u32le(offset),
    ...u16le(0),
  ])

  const all    = [...parts, ...central, eocd]
  const total  = all.reduce((s, b) => s + b.length, 0)
  const result = new Uint8Array(total)
  let pos = 0
  for (const b of all) { result.set(b, pos); pos += b.length }
  return result
}

// ─── download helper ──────────────────────────────────────────
function downloadBlob(data, filename, mime) {
  const blob = new Blob([data], { type: mime })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ─── Component ────────────────────────────────────────────────
export default function AnalyticsExport() {
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(null)   // 'csv' | 'excel' | 'powerbi'

  async function fetchAll() {
    const [waste, inventory, predictions, sales] = await Promise.all([
      supabase.from('waste_log').select('*').order('date', { ascending: true }),
      supabase.from('inventory').select('*').order('expires_at', { ascending: true }),
      supabase.from('predictions').select('*, menu_items(name)').order('predict_date', { ascending: false }),
      supabase.from('sales_log').select('*, menu_items(name)').order('date', { ascending: false }).limit(200),
    ])
    return {
      waste:       waste.data       || [],
      inventory:   inventory.data   || [],
      predictions: predictions.data || [],
      sales:       sales.data       || [],
    }
  }

  // ── CSV export ───────────────────────────────────────────────
  async function exportCSV() {
    setLoading('csv'); setOpen(false)
    try {
      const { waste } = await fetchAll()
      const headers = ['Date', 'Item Name', 'Quantity', 'Unit', 'Reason', 'Cost Lost (INR)']
      const rows    = waste.map(w => [
        w.date, w.item_name, w.quantity, w.unit, w.reason, w.cost_lost
      ])

      const csv = [headers, ...rows]
        .map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\r\n')

      downloadBlob(
        '\uFEFF' + csv,    // BOM for Excel UTF-8 detection
        `foodsense_waste_${new Date().toISOString().slice(0,10)}.csv`,
        'text/csv;charset=utf-8'
      )
    } finally { setLoading(null) }
  }

  // ── Excel / Power BI export (same file, different trigger) ──
  async function exportExcel(isPowerBI = false) {
    setLoading(isPowerBI ? 'powerbi' : 'excel'); setOpen(false)
    try {
      const { waste, inventory, predictions, sales } = await fetchAll()
      const today = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })

      // Sheet 1 — Waste Summary
      const wasteHeaders = ['Date', 'Item Name', 'Quantity (kg)', 'Unit', 'Reason', 'Cost Lost (₹)']
      const wasteRows    = waste.map(w => [
        w.date, { v: w.item_name, bold: true },
        w.quantity, w.unit, w.reason,
        { v: w.cost_lost, fmt: 'currency' },
      ])

      // Sheet 2 — Inventory
      const invHeaders = ['Item', 'Category', 'Quantity', 'Unit', 'Expires', 'Cost per Unit (₹)', 'Status']
      const invRows    = inventory.map(i => {
        const days = Math.ceil((new Date(i.expires_at) - new Date()) / 86400000)
        const status = days <= 0 ? 'Critical' : days <= 2 ? 'Warning' : 'Good'
        return [
          { v: i.name, bold: true }, i.category,
          i.quantity, i.unit, i.expires_at,
          { v: i.cost_per_unit, fmt: 'currency' }, status,
        ]
      })

      // Sheet 3 — Predictions
      const predHeaders = ['Menu Item', 'Predict Date', 'Predicted (servings)', 'Actual (servings)', 'Confidence (%)']
      const predRows    = predictions.map(p => [
        { v: p.menu_items?.name || 'Unknown', bold: true },
        p.predict_date, p.predicted_qty,
        p.actual_qty ?? 'Pending',
        { v: Number(p.confidence) / 100, fmt: 'pct' },
      ])

      // Sheet 4 — PowerBI flat table
      const pbHeaders = ['Date', 'Item_Name', 'Waste_kg', 'Cost_Lost_INR', 'Reason', 'Predicted_Servings', 'Actual_Servings']
      const pbRows    = waste.map(w => {
        const matchedPred = predictions.find(p =>
          p.menu_items?.name?.toLowerCase().includes(w.item_name.toLowerCase()) ||
          w.item_name.toLowerCase().includes(p.menu_items?.name?.toLowerCase())
        )
        return [
          w.date, w.item_name, w.quantity,
          { v: w.cost_lost, fmt: 'currency' },
          w.reason,
          matchedPred?.predicted_qty ?? '',
          matchedPred?.actual_qty    ?? '',
        ]
      })

      // Sheet 5 — Instructions (Power BI)
      const instrHeaders = ['Step', 'Action', 'Details']
      const instrRows    = [
        ['1', 'Open Power BI Desktop',      'Download free from microsoft.com/powerbi'],
        ['2', 'Get Data',                   'Home ribbon → Get Data → Excel Workbook'],
        ['3', 'Select this file',           'Browse to the downloaded .xlsx file → Open'],
        ['4', 'Select PowerBI_Data sheet',  'Check PowerBI_Data in Navigator → Transform Data'],
        ['5', 'Set column types',           'Date=Date, Waste_kg=Decimal, Cost_Lost_INR=Whole Number'],
        ['6', 'Close & Apply',              'Click Close & Apply to load data into Power BI'],
        ['7', 'Build visuals',              'Line chart: Date vs Waste_kg | Bar: Item vs Cost | Donut: Reason'],
        ['8', 'Add slicers',               'Add slicers for Date, Reason to make report interactive'],
        ['9', 'Publish (optional)',         'Sign in to app.powerbi.com → Publish → access from any browser'],
        ['10','Refresh',                    'Replace this file in the same path and click Refresh in Power BI'],
      ]

      const files = buildXlsx([
        {
          name: 'Waste Summary', headers: wasteHeaders, rows: wasteRows,
          colWidths: [14, 22, 14, 10, 18, 16],
        },
        {
          name: 'Inventory', headers: invHeaders, rows: invRows,
          colWidths: [20, 14, 12, 10, 14, 16, 12],
        },
        {
          name: 'Predictions', headers: predHeaders, rows: predRows,
          colWidths: [22, 14, 20, 18, 16],
        },
        {
          name: 'PowerBI_Data', headers: pbHeaders, rows: pbRows,
          colWidths: [14, 22, 12, 16, 18, 20, 18],
        },
        {
          name: 'PowerBI_Instructions', headers: instrHeaders, rows: instrRows,
          colWidths: [6, 28, 52],
        },
      ])

      const zip = buildZip(files)
      const filename = isPowerBI
        ? `foodsense_powerbi_${new Date().toISOString().slice(0,10)}.xlsx`
        : `foodsense_analytics_${new Date().toISOString().slice(0,10)}.xlsx`

      downloadBlob(
        zip,
        filename,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
    } finally { setLoading(null) }
  }

  // ─── UI ───────────────────────────────────────────────────────
  const isLoading = loading !== null

  const options = [
    {
      id:    'csv',
      icon:  FileText,
      label: 'Export as CSV',
      sub:   'Waste log — opens in any spreadsheet',
      action: exportCSV,
    },
    {
      id:    'excel',
      icon:  FileSpreadsheet,
      label: 'Export as Excel',
      sub:   'Multi-sheet: Waste, Inventory, Predictions',
      action: () => exportExcel(false),
    },
    {
      id:    'powerbi',
      icon:  BarChart2,
      label: 'Export for Power BI',
      sub:   'Same Excel + step-by-step import guide',
      action: () => exportExcel(true),
    },
  ]

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger button */}
      <button
        onClick={() => !isLoading && setOpen(o => !o)}
        disabled={isLoading}
        style={{
          height: 34,
          padding: '0 0.9rem',
          background: isLoading ? 'var(--bg2)' : 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          color: isLoading ? 'var(--text-3)' : 'var(--text-2)',
          fontSize: '0.8rem',
          fontWeight: 500,
          cursor: isLoading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          boxShadow: 'var(--shadow-sm)',
          fontFamily: 'Geist, sans-serif',
        }}
        onMouseEnter={e => { if (!isLoading) e.currentTarget.style.background = 'var(--bg2)' }}
        onMouseLeave={e => { if (!isLoading) e.currentTarget.style.background = 'var(--surface)' }}
      >
        {isLoading
          ? <><Loader size={13} className="animate-spin" /> Exporting...</>
          : <><Download size={13} /> Export <ChevronDown size={11} style={{ opacity: 0.6 }} /></>
        }
      </button>

      {/* Dropdown */}
      {open && !isLoading && (
        <>
          {/* Backdrop */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            onClick={() => setOpen(false)}
          />

          {/* Menu */}
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              zIndex: 50,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              boxShadow: 'var(--shadow-lg)',
              padding: '0.4rem',
              minWidth: 250,
            }}
            className="fade-in"
          >
            {options.map(({ id, icon: Icon, label, sub, action }) => (
              <button
                key={id}
                onClick={() => { setOpen(false); action() }}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.6rem 0.75rem',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 7,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'Geist, sans-serif',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: id === 'powerbi'
                    ? 'rgba(37,99,235,0.08)'
                    : id === 'excel'
                    ? 'var(--accent-bg)'
                    : 'var(--bg3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={15} color={
                    id === 'powerbi' ? 'var(--blue)' :
                    id === 'excel'   ? 'var(--accent)' : 'var(--text-2)'
                  } />
                </div>
                <div>
                  <p style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text)', marginBottom: 1 }}>
                    {label}
                  </p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>
                    {sub}
                  </p>
                </div>
              </button>
            ))}

            <div style={{
              margin: '0.4rem 0.75rem 0.2rem',
              paddingTop: '0.4rem',
              borderTop: '1px solid var(--border)',
              fontSize: '0.67rem',
              color: 'var(--text-3)',
              lineHeight: 1.4,
            }}>
              Exports live data from Supabase
            </div>
          </div>
        </>
      )}
    </div>
  )
}