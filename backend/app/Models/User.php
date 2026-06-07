<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'email_verification_token',
        'password_reset_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Generate email verification token
     */
    public function generateEmailVerificationToken(): string
    {
        $token = bin2hex(random_bytes(32));
        $this->email_verification_token = $token;
        $this->save();
        return $token;
    }

    /**
     * Mark email as verified
     */
    public function markEmailAsVerified(): bool
    {
        return $this->forceFill([
            'email_verified_at' => $this->freshTimestamp(),
            'email_verification_token' => null,
        ])->save();
    }

    /**
     * Check if email is verified
     */
    public function isEmailVerified(): bool
    {
        return !is_null($this->email_verified_at);
    }

    /**
     * Generate password reset token
     */
    public function generatePasswordResetToken(): string
    {
        $token = bin2hex(random_bytes(32));
        $this->forceFill([
            'password_reset_token' => $token,
            'password_reset_expires_at' => now()->addHours(24),
        ])->save();
        return $token;
    }

    /**
     * Verify password reset token is valid
     */
    public function verifyPasswordResetToken(string $token): bool
    {
        return $this->password_reset_token === $token 
            && $this->password_reset_expires_at 
            && $this->password_reset_expires_at->isFuture();
    }

    /**
     * Clear password reset token
     */
    public function clearPasswordResetToken(): bool
    {
        return $this->forceFill([
            'password_reset_token' => null,
            'password_reset_expires_at' => null,
        ])->save();
    }
}