const baseUrl = "http://localhost:3000/"

export const getRoute = (url) => {
  const slicedUrl = url.slice(baseUrl.length)
  let route = {
    page: "Home",
    payload: ""
  }
  if (slicedUrl.length === 0) {
    return route;
  }
  route.page = "Redeem"
  return route;
}


export const extractRawPayload = (url) => {
  const slicedUrl = url.slice(baseUrl.length) 
  const prefix = slicedUrl.slice(0,10)
  console.log(prefix)
  if (prefix !== "redeem?pl=") {
    return "Invalid"
  }
  const payload = slicedUrl.slice(10)
  console.log(payload)
  const validPayloadLength = 44
  if (payload.length !== validPayloadLength) {
    return "Invalid"
  }
  return payload;
}


export const parsePayload = (pl) => {
  return window.atob(pl.replace(/_/g, '/').replace(/-/g, '+'));
}

  
export const hash = async (string) => {
  const utf8 = new TextEncoder().encode(string);
  const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((bytes) => bytes.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}
  
  
export const hexToAscii = (str1) => {
  var hex  = str1.toString();
  var str = '';
  for (var n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return str;
}
  

export const toHexString = (byteArray) => {
  return Array.from(byteArray, function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('')
}


export const xorHashes = (a, b) => {
  var res = [],
    i = a.length,
    j = b.length;

  while (i-->0 && j-->0) {
    res = [(a.charCodeAt(i) ^ b.charCodeAt(j)), ...res];
  }

  res = toHexString(res);
  return res;
}

export const inputOnFocus = (input, defaultVal) => {
  if (input.value === defaultVal) {
      input.value = ''
  }
}

export const inputOnBlur = (input, defaultVal) => {
  if (input.value === '') {
      input.value = defaultVal
  }
}