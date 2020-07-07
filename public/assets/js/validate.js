class Validate {
  static formatAppartment(appart){
    return parseInt(appart);
  }
  static entryToHebrew(entry){
    switch (entry) {
      case '-': return 0;
      case '0': return 0;
      case 'a': return 'א';
      case 'b': return 'ב';
      case 'c': return 'ג';
      case 'd': return 'ד';
      case 'e': return 'ה';
    }
    return entry;
  }
  static entryToEnglish(entry){
    switch (entry) {
      case '-': return 0;
      case '0': return 0;
      case 'א': return 'a';
      case 'ב': return 'b';
      case 'ג': return 'c';
      case 'ד': return 'd';
      case 'ה': return 'e';
    }
    return entry;
  }
}
