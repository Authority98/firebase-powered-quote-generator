# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- New "Where did you find us?" field in the quote form
  - Options include Google Search, Social Media, and Friend or Family
  - Added validation for the new field
  - Updated email template to include the source information

### Changed
- Updated toggle switch pricing system
  - Added separate pricing for ON/OFF positions (Left/Right text)
  - Modified price calculation logic in TentSelectionCard and TentSelection components
  - Updated admin interface to support dual pricing input
  - Improved price display in the table view

### Fixed
- Removed UK postcode validation pattern from venue location field
- Fixed validation message to be more generic for location input
- Corrected price calculations for toggle switch extras based on their state
- Improved handling of default values in the form

### Technical Updates
- Enhanced code organization in TentSelectionCard component
- Improved state management for toggle switch extras
- Updated Firebase data structure to support new pricing model
- Added backward compatibility for existing price fields

## [1.0.0] - Initial Release

### Features
- Quote generation system
- Dynamic tent selection based on event requirements
- Extras management with multiple display types
- Admin dashboard for product and extras management
- Email notification system
- Responsive design for all screen sizes 