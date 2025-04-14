[Authorize]
[HttpGet("profile")]
public async Task<IActionResult> GetProfile()
{
    var userId = User.FindFirstValue("uid");
    var user = await _userManager.FindByIdAsync(userId);
    return Ok(new { user.Email, user.UserName });
}
