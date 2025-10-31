import { type ClassValue } from 'clsx'
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

const ISO_NAIVE_REGEX = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(\.\d+)?$/
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/

export type DateInput = string | number | Date | null | undefined

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function normaliseDateInput(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const naiveMatch = ISO_NAIVE_REGEX.exec(trimmed)
  if (naiveMatch) {
    const [, datePart, timePart, fractional] = naiveMatch
    return `${datePart}T${timePart}${fractional ?? ''}Z`
  }
  if (DATE_ONLY_REGEX.test(trimmed)) {
    return `${trimmed}T00:00:00Z`
  }
  return trimmed
}

export function toDate(value: DateInput): Date | null {
  if (value == null) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'string') {
    const normalised = normaliseDateInput(value)
    if (!normalised) return null
    const parsed = new Date(normalised)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatWithOptions(value: DateInput, options: Intl.DateTimeFormatOptions, fallback: string) {
  const date = toDate(value)
  if (!date) return typeof value === 'string' ? value : fallback
  try {
    if (options.dateStyle && options.timeStyle) {
      return date.toLocaleString(undefined, options)
    }
    if (options.dateStyle) {
      return date.toLocaleDateString(undefined, options)
    }
    return date.toLocaleTimeString(undefined, options)
  } catch {
    return date.toString()
  }
}

export function formatDateTimeLocal(value: DateInput, fallback = '—') {
  return formatWithOptions(value, { dateStyle: 'medium', timeStyle: 'short' }, fallback)
}

export function formatDateLocal(value: DateInput, fallback = '—') {
  return formatWithOptions(value, { dateStyle: 'medium' }, fallback)
}

export function formatTimeLocal(value: DateInput, fallback = '—') {
  return formatWithOptions(value, { hour: 'numeric', minute: '2-digit' }, fallback)
}
