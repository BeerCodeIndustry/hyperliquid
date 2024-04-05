pub fn private_key_slice(s: &str) -> &str {
    if s.starts_with("0x") {
        &s[2..]
    } else {
        &s
    }
}
