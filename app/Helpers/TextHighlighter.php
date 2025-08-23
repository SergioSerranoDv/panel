<?php

namespace Pterodactyl\Helpers;

class TextHighlighter
{
    /**
     * Highlight matched text in a line with HTML mark tags.
     *
     * @param string $text The text to search within
     * @param string $query The search term to highlight
     * @param string $tag The HTML tag to wrap matches (default: 'mark')
     * @return string The text with highlighted matches
     */
    public static function highlight(string $text, string $query, string $tag = 'mark'): string
    {
        if (empty($query)) {
            return $text;
        }

        return preg_replace(
            '/' . preg_quote($query, '/') . '/i',
            "<{$tag}>\$0</{$tag}>",
            $text
        );
    }

    /**
     * Highlight multiple terms in text.
     *
     * @param string $text
     * @param array $queries
     * @param string $tag
     * @return string
     */
    public static function highlightMultiple(string $text, array $queries, string $tag = 'mark'): string
    {
        foreach ($queries as $query) {
            $text = self::highlight($text, $query, $tag);
        }

        return $text;
    }
}
