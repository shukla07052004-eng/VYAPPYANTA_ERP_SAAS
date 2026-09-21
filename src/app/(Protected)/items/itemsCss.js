const itemFormHeroStyle = {
  background: 'linear-gradient(135deg, #16324f 0%, #244e73 55%, #3d7ba7 100%)',
  borderRadius: 24,
  padding: '22px 24px',
  display: 'flex',
  justifyContent: 'space-between',
  gap: 18,
  alignItems: 'center',
  color: '#fff',
  boxShadow: '0 18px 34px rgba(22,50,79,.18)',
}

const heroMetaChipStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 999,
  padding: '7px 12px',
  fontSize: 12,
  fontWeight: 700,
}

const formSectionStyle = {
  display: 'grid',
  gap: 14,
  padding: '18px 18px 16px',
  border: '1px solid #dce4ea',
  borderRadius: 22,
  background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)',
  boxShadow: '0 8px 20px rgba(15, 23, 42, .04)',
}

const itemFieldStyle = {
  minHeight: 48,
  padding: '12px 14px',
  borderRadius: 14,
  fontSize: 14,
  borderColor: '#ccd8e4',
  background: '#fcfdff',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.8)',
}

const selectorFrameStyle = {
  display: 'grid',
  gap: 12,
  padding: 12,
  borderRadius: 18,
  border: '1px solid #d5e2eb',
  background: 'linear-gradient(180deg, #f8fbfd 0%, #f3f8fb 100%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.9)',
}

const pillButtonStyle = {
  border: '1px solid #c7d8e5',
  background: '#fff',
  color: '#20425b',
  borderRadius: 999,
  padding: '10px 14px',
  fontSize: 13,
  fontWeight: 700,
  transition: 'all .16s ease',
}

const activePillButtonStyle = {
  background: '#20425b',
  color: '#fff',
  borderColor: '#20425b',
  boxShadow: '0 8px 18px rgba(32,66,91,.22)',
}

const alertCardStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 14,
  padding: '14px 16px',
  borderRadius: 18,
  border: '1px solid #e5ecf1',
  background: '#f8fbfe',
}

const stickyFooterStyle = {
  position: 'sticky',
  bottom: -20,
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 10,
  padding: '14px 0 2px',
  background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.96) 24%, rgba(255,255,255,1) 100%)',
}

const sectionLabelStyle = {
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--ink-40)',
  textTransform: 'uppercase',
  letterSpacing: '.07em',
  display: 'block',
  marginBottom: 8,
}

const gstSelectorStyle = {
  display: 'grid',
  gridTemplateColumns: '56px 1fr 56px',
  alignItems: 'center',
  gap: 12,
}

const productTypeSelectorStyle = {
  display: 'grid',
  gridTemplateColumns: '56px 1fr 56px',
  alignItems: 'center',
  gap: 12,
}

const productTypeValueStyle = {
  display: 'grid',
  placeItems: 'center',
  minHeight: 62,
  borderRadius: 18,
  background: 'linear-gradient(135deg, #eef7ff 0%, #f9fcff 100%)',
  border: '1px solid #c9dcef',
  color: '#16324f',
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: '-.03em',
  textAlign: 'center',
  padding: '0 12px',
}

const productTypeHintStyle = {
  textAlign: 'center',
  fontSize: 12,
  color: 'var(--ink-60)',
  fontWeight: 600,
}

const gstArrowButtonStyle = {
  border: '1px solid #c7d8e5',
  background: '#fff',
  color: '#17344d',
  borderRadius: 16,
  minHeight: 52,
  fontSize: 28,
  lineHeight: 1,
  boxShadow: '0 6px 16px rgba(23,52,77,.08)',
}

const gstValueStyle = {
  display: 'grid',
  placeItems: 'center',
  minHeight: 62,
  borderRadius: 18,
  background: 'linear-gradient(135deg, #fef7e8 0%, #fffdfa 100%)',
  border: '1px solid #f0dcb3',
  color: '#8a4d00',
  fontSize: 28,
  fontWeight: 800,
  letterSpacing: '-.04em',
  transition: 'transform .18s ease',
}

const miniCardButtonStyle = {
  width: '100%',
  border: '1px solid var(--border)',
  background: 'var(--surface-2)',
  borderRadius: 'var(--r-md)',
  padding: '10px 12px',
  textAlign: 'left',
}

const tabStyle = {
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '8px 12px',
  fontSize: 12.5,
  fontWeight: 700,
}

const dropzoneStyle = {
  border: '1px dashed var(--border-3)',
  borderRadius: 'var(--r-md)',
  background: 'var(--surface-2)',
  padding: '18px 16px',
  display: 'grid',
  gap: 6,
  textAlign: 'center',
  marginBottom: 14,
}


function expiryBadgeStyle(variant) {
  const palette = variant === 'danger'
  ? { color: '#b91c1c', bg: '#fff1f2', border: '#fecdd3' }
  : variant === 'warning'
  ? { color: '#9a5b00', bg: '#fff7e6', border: '#f7d58b' }
  : { color: '#166534', bg: '#effcf3', border: '#bbf7d0' }
  
  return {
    display: 'inline-flex',
    alignItems: 'center',
    width: 'fit-content',
    borderRadius: 999,
    padding: '3px 8px',
    fontSize: 11,
    fontWeight: 700,
    border: `1px solid ${palette.border}`,
    background: palette.bg,
    color: palette.color,
  }
}

export  {
    dropzoneStyle, 
    tabStyle, 
    miniCardButtonStyle, 
    expiryBadgeStyle,
    gstValueStyle,
    gstArrowButtonStyle,
    productTypeHintStyle,
    productTypeValueStyle,
    productTypeSelectorStyle,
    sectionLabelStyle,
    gstSelectorStyle ,
    stickyFooterStyle,
    alertCardStyle,
    activePillButtonStyle,
    pillButtonStyle,
    selectorFrameStyle,
    itemFieldStyle,
    formSectionStyle,
    heroMetaChipStyle,
    itemFormHeroStyle
}