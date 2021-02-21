pub fn is_valid_secret(share_secret: &str) -> bool {
    share_secret.len() >= 33
        && share_secret == share_secret.to_uppercase()
        && (share_secret.starts_with('A')
            || share_secret.starts_with('B')
            || share_secret.starts_with('D')
            || share_secret.starts_with('E')
            || share_secret.starts_with('F'))
}
