<?php
namespace Pterodactyl\Transformers\Api\Client;

use Carbon\Carbon;
use Illuminate\Support\Arr;

class SearchResultTransformer extends BaseClientTransformer
{
    /**
     * Transform a search result item into a standardized response
     */
    public function transform(array $item): array
    {
        return [
            'file' => $item['file'],
            'line' => $item['line'],
            'snippet' => $item['snippet'],
        ];
    }

    public function getResourceName(): string
    {
        return 'search_result';
    }
}

?>
