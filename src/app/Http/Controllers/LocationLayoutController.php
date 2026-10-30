<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateLocationLayoutRequest;
use App\Models\Location;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class LocationLayoutController extends Controller
{
    /**
     * Get location layout
     *
     * @endpoint
     * @authenticated
     * @urlParam location integer required The location ID.
     * @responseField layout object The layout with svg (string or null) and image_url (string or null).
     */
    public function show(Location $location): JsonResponse
    {
        return response()->json(['layout' => $this->payload($location)]);
    }

    /**
     * Save location layout
     *
     * Replaces the SVG and, when an image is sent, the background image.
     *
     * @endpoint
     * @authenticated
     * @urlParam location integer required The location ID.
     * @responseField layout object The saved layout with svg (string or null) and image_url (string or null).
     */
    public function update(UpdateLocationLayoutRequest $request, Location $location): JsonResponse
    {
        $location->layout_svg = $request->input('svg') ?: null;

        if ($request->hasFile('image')) {
            $this->deleteImage($location);
            $location->layout_image_path = $request->file('image')->store('location-layouts', 'public');
        }

        $location->save();

        return response()->json(['layout' => $this->payload($location)]);
    }

    /**
     * Clear location layout
     *
     * Removes the SVG and the background image.
     *
     * @endpoint
     * @authenticated
     * @urlParam location integer required The location ID.
     */
    public function destroy(Location $location): JsonResponse
    {
        $this->deleteImage($location);
        $location->forceFill(['layout_svg' => null, 'layout_image_path' => null])->save();

        return response()->json(['layout' => $this->payload($location)]);
    }

    /**
     * Get location layout image
     *
     * Public on purpose: it is a plain <img> source and will also be shown to members.
     *
     * @endpoint
     * @unauthenticated
     * @urlParam location integer required The location ID.
     */
    public function image(Location $location): BinaryFileResponse|JsonResponse
    {
        $path = $location->layout_image_path;

        if (! $path || ! Storage::disk('public')->exists($path)) {
            return response()->json(['message' => 'No layout image'], 404);
        }

        return response()->file(Storage::disk('public')->path($path), [
            'Cache-Control' => 'public, max-age=31536000, immutable',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function deleteImage(Location $location): void
    {
        if ($location->layout_image_path) {
            Storage::disk('public')->delete($location->layout_image_path);
        }
    }

    /**
     * @return array{svg: string|null, image_url: string|null}
     */
    private function payload(Location $location): array
    {
        $imageUrl = $location->layout_image_path
            ? "/api/locations/{$location->id}/layout/image?v=".md5($location->layout_image_path)
            : null;

        return ['svg' => $location->layout_svg, 'image_url' => $imageUrl];
    }
}
