class Format {
  static dateToColon(d){
    let mins = d.getMinutes();
    let hours = d.getHours();
    mins = addZero(mins);
    hours = addZero(hours);
    return  hours + ':' + mins;

    function addZero(n){
      if (n < 10) return '0' + n;
      else return n;
    }
  }
  static addColon(s){
    return s.slice(0, 2) + ':' + s.slice(2);
  }
  static toWeekday(n){
    const weekdays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return weekdays[n];
  }
  static to4Chars(h, m){
    if (m < 10) m = '0' + m;
    if (h < 10) h = '0' + h;
    return h.toString() + m;
  }
  static toHourMinutesObject(time, dayData){
    let formatted = {};
    time = time.toString();
    //Check as int first, then string...
    if (time.length == 2){ // '22'
      formatted.hour = time;
      formatted.minutes = 0;
    }
    else if (time.length == 4) { // '2005'
      formatted.hour = time[0] + time[1];
      formatted.minutes = time[2] + time[3];
    }
    else if (time.includes(':')){ // '00:00'
      const arr = time.split(':');
      formatted.hour = arr[0];
      formatted.minutes = arr[1];
    }
    else if (time.includes('+')){ // 'candles+1'
      const arr = time.split('+');
      const actualTime = Format.toHourMinutesObject(arr[0], dayData); // word to time obj
      formatted.hour = actualTime.hour + parseInt(arr[1]); // add the after hours
      formatted.minutes = actualTime.minutes;
    }
    else if (time.includes('-')){ // 'havdala-2'
      const arr = time.split('-');
      const actualTime = Format.toHourMinutesObject(arr[0]); // word to time obj
      formatted.hour = actualTime.hour - parseInt(arr[1]); // subtract the after hours
      formatted.minutes = actualTime.minutes;
    }
    else if (time == 'candles' || time == 'havdala' || time == 'sunset') {
      const actualTime = Format.toHourMinutesObject(dayData[time]);
      formatted.hour = actualTime.hour;
      formatted.minutes = actualTime.minutes;
    }

    return parse(formatted);

    function parse(f){
      f.hour = parseInt(f.hour);
      f.minutes = roundMin(parseInt(f.minutes));
      return f;

      function roundMin(m){ return Math.ceil(m / 5) * 5; }
    }
  }
}
