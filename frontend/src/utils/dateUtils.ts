/**
 * Simple date utilities - one format everywhere
 */

/**
 * Converts any date input to a Date object
 */
export const toDate = (input: string | number | Date): Date | null => {
  try {
    if (input instanceof Date) return input
    const date = new Date(input)
    return isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

/**
 * Simple date and time formatting - same everywhere
 * @param date - Date object
 * @returns Formatted string: "MM/DD/YYYY, HH:MM AM/PM"
 */
export const formatDateTime = (date: Date): string => {
  try {
    if (!date || isNaN(date.getTime())) {
      return 'Invalid date'
    }
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  } catch (error) {
    console.error('Error formatting date:', error, date)
    return 'Invalid date'
  }
}
