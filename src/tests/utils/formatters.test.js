import { describe, it, expect } from 'vitest';
import {
  formatRuntime,
  formatDate,
  formatYear,
  formatRating,
  formatVoteCount,
  formatCurrency,
  truncateText,
  getMediaTypeDisplay,
  formatGenres,
} from '../../utils/formatters.js';

describe('Formatters', () => {
  describe('formatRuntime', () => {
    it('should format runtime correctly', () => {
      expect(formatRuntime(90)).toBe('1h 30m');
      expect(formatRuntime(60)).toBe('1h');
      expect(formatRuntime(45)).toBe('45m');
      expect(formatRuntime(120)).toBe('2h');
      expect(formatRuntime(null)).toBe('N/A');
      expect(formatRuntime(0)).toBe('0m');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      expect(formatDate('2023-12-25')).toBe('December 25, 2023');
      expect(formatDate('2023-01-01')).toBe('January 1, 2023');
      expect(formatDate(null)).toBe('N/A');
      expect(formatDate('')).toBe('N/A');
    });
  });

  describe('formatYear', () => {
    it('should extract year correctly', () => {
      expect(formatYear('2023-12-25')).toBe('2023');
      expect(formatYear('2023-01-01')).toBe('2023');
      expect(formatYear(null)).toBe('N/A');
      expect(formatYear('')).toBe('N/A');
    });
  });

  describe('formatRating', () => {
    it('should format rating as percentage', () => {
      expect(formatRating(8.5)).toBe('85%');
      expect(formatRating(7.2)).toBe('72%');
      expect(formatRating(10)).toBe('100%');
      expect(formatRating(null)).toBe('N/A');
      expect(formatRating(0)).toBe('0%');
    });
  });

  describe('formatVoteCount', () => {
    it('should format vote count with suffixes', () => {
      expect(formatVoteCount(1500000)).toBe('1.5M');
      expect(formatVoteCount(1000000)).toBe('1.0M');
      expect(formatVoteCount(1500)).toBe('1.5K');
      expect(formatVoteCount(1000)).toBe('1.0K');
      expect(formatVoteCount(500)).toBe('500');
      expect(formatVoteCount(null)).toBe('0');
      expect(formatVoteCount(0)).toBe('0');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000');
      expect(formatCurrency(1500)).toBe('$1,500');
      expect(formatCurrency(null)).toBe('N/A');
      expect(formatCurrency(0)).toBe('$0');
    });
  });

  describe('truncateText', () => {
    it('should truncate text correctly', () => {
      const longText = 'This is a very long text that should be truncated because it exceeds the maximum length limit that we have set for this function.';
      expect(truncateText(longText, 50)).toBe('This is a very long text that should be truncated...');
      expect(truncateText('Short text', 50)).toBe('Short text');
      expect(truncateText(null)).toBe('');
      expect(truncateText('')).toBe('');
    });
  });

  describe('getMediaTypeDisplay', () => {
    it('should return correct display names', () => {
      expect(getMediaTypeDisplay('movie')).toBe('Movie');
      expect(getMediaTypeDisplay('tv')).toBe('TV Show');
      expect(getMediaTypeDisplay('person')).toBe('Person');
      expect(getMediaTypeDisplay('unknown')).toBe('Unknown');
    });
  });

  describe('formatGenres', () => {
    it('should format genres correctly', () => {
      const genres = [
        { id: 1, name: 'Action' },
        { id: 2, name: 'Adventure' },
        { id: 3, name: 'Comedy' },
      ];
      expect(formatGenres(genres)).toBe('Action, Adventure, Comedy');
      expect(formatGenres([])).toBe('N/A');
      expect(formatGenres(null)).toBe('N/A');
    });
  });
});
