!macro preInit
  ; Create early log file before installation directory is available
  SetOutPath "$TEMP"
  FileOpen $0 "$TEMP\installer-debug.log" w
  FileWrite $0 "Installation started at ${__DATE__} ${__TIME__}$\r$\n"
  FileWrite $0 "-------------------------------$\r$\n"
  FileWrite $0 "OS Version: $\r$\n"
  FileWrite $0 "System Directory: $SYSDIR$\r$\n"
  FileWrite $0 "Temp Directory: $TEMP$\r$\n"
  FileClose $0
!macroend

!macro customInit
  ; Enable early logging 
  LogSet on
  LogText "Starting early initialization of Gaming POS System"
!macroend

; Define the ErrorLog macro outside of any other macro
!macro ErrorLog msg
  DetailPrint "ERROR: ${msg}"
  FileOpen $0 "$INSTDIR\install-log.txt" a
  FileWrite $0 "ERROR: ${msg}$\r$\n"
  FileClose $0
  LogText "ERROR: ${msg}"
!macroend

!macro customInstall
  ; Enable logging
  LogSet on
  
  ; Set log file name
  LogText "Starting installation of Gaming POS System"
  
  ; Log system information
  LogText "Windows version: $R0"
  LogText "System directory: $SYSDIR"
  
  ; Create additional log file in a user-accessible location
  FileOpen $0 "$INSTDIR\install-log.txt" w
  FileWrite $0 "Installation started at ${__DATE__} ${__TIME__}$\r$\n"
  FileWrite $0 "-------------------------------$\r$\n"
  FileWrite $0 "Temp log location: $TEMP\installer-debug.log$\r$\n"
  FileClose $0
  
  ; Copy the temp log to the installation directory
  CopyFiles "$TEMP\installer-debug.log" "$INSTDIR\installer-debug.log"
!macroend

!macro customUnInstall
  ; Enable logging for uninstallation
  LogSet on
  LogText "Starting uninstallation of Gaming POS System"
!macroend 