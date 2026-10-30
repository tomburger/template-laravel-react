<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLocationLayoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'svg' => 'nullable|string|max:1000000',
            // SVG uploads are deliberately excluded: the image is served from our own origin
            'image' => 'nullable|file|mimes:jpg,jpeg,png,gif,webp|max:10240',
        ];
    }

    /**
     * @return array<string, array<string, string>>
     */
    public function bodyParameters(): array
    {
        return [
            'svg' => [
                'description' => 'SVG markup drawn over the image. Elements with id "unit-<unitId>" represent units.',
                'example' => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"></svg>',
            ],
            'image' => [
                'description' => 'Background image (jpg, png, gif or webp, up to 10 MB). Omit to keep the current one.',
            ],
        ];
    }
}
