export function getRoleSwitchTransition(currentRole) {
  if (currentRole === 'librarian') {
    return {
      nextRole: 'reader',
      preserveCurrentLibrary: true
    };
  }

  // Returning to librarian must go through role selection and library password
  // verification again; never grant librarian access by a direct toggle.
  return {
    nextRole: null,
    preserveCurrentLibrary: false
  };
}
