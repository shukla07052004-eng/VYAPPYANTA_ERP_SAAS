const API_BASE = '/api'

export async function uploadImportFile(file, options = {}) {
  const formData = new FormData()

  formData.append('file', file)

  if (options.importKind) {
    formData.append('importKind', options.importKind)
  }

  options.onProgress?.(10)

  const response = await fetch(`${API_BASE}/import`, {
    method: 'POST',
    body: formData,
  })

  options.onProgress?.(90)

  const payload = await response.json().catch(() => ({}))

  if (!response.ok || !payload.success) {
    throw new Error(
      payload?.message ||
      payload?.data?.errors?.[0]?.message ||
      'Import API request failed.'
    )
  }

  options.onProgress?.(100)

  return payload.data
}

export default uploadImportFile